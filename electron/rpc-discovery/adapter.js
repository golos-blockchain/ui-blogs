'use strict';
const path = require('node:path');
const fs = require('node:fs');
const cp = require('node:child_process');
const { TextDecoder } = require('node:util');
const TRUST = 'UNVERIFIED_PEER_ANNOUNCEMENT';
const MAX_BYTES = 65536;
function childEnvironment(env) {
  const allowed = new Set(['systemroot', 'windir', 'comspec', 'path', 'pathext', 'userprofile', 'homedrive', 'homepath', 'home', 'appdata', 'localappdata', 'tmp', 'temp', 'tmpdir', 'lang', 'language', 'lc_all', 'lc_ctype', 'ssl_cert_file', 'ssl_cert_dir']);
  return Object.fromEntries(Object.entries(env).filter(([key]) => allowed.has(key.toLowerCase())));
}
function searchArgs(configDir) { return ['--search', configDir, '15']; }
function validateEndpoint(value) {
  if (typeof value !== 'string' || value.length > 2048 || !/^(https?|wss?):\/\//.test(value) || /[\s\u0000-\u001f\u007f\\]/.test(value)) throw Error('INVALID_OUTPUT');
  let u; try { u = new URL(value); } catch (_) { throw Error('INVALID_OUTPUT'); }
  if (!['https:', 'http:', 'wss:', 'ws:'].includes(u.protocol) || !u.hostname || u.username || u.password || u.hash) throw Error('INVALID_OUTPUT');
  return u.href;
}
function parseOutput(bytes, now = Date.now()) {
  let entries;
  try { entries = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(bytes)); } catch (_) { throw Error('INVALID_OUTPUT'); }
  if (!Array.isArray(entries) || entries.length > 64) throw Error('INVALID_OUTPUT');
  const found = new Map();
  for (const r of entries) {
    if (!r || typeof r !== 'object' || Array.isArray(r) || r.trust !== TRUST || !Number.isSafeInteger(r.expires) || r.expires <= Math.floor(now / 1000)) throw Error('INVALID_OUTPUT');
    const url = validateEndpoint(r.url);
    found.set(url, {url, expires: r.expires, trust: TRUST});
  }
  return [...found.values()];
}
function createDiscovery(options) {
  const {resourcesPath, userData} = options;
  const platform = options.platform || process.platform;
  const arch = options.arch || process.arch;
  const spawn = options.spawn || cp.spawn;
  const existsSync = options.existsSync || fs.existsSync;
  const mkdirSync = options.mkdirSync || fs.mkdirSync;
  const env = childEnvironment(options.env || process.env);
  const timerSet = options.setTimeout || setTimeout, timerClear = options.clearTimeout || clearTimeout;
  let active = null;
  return {
    start() {
      if (active) return Promise.resolve({status: 'error', code: 'BUSY', endpoints: []});
      if (!['win32', 'linux'].includes(platform) || !['x64', 'arm64', 'ia32'].includes(arch)) return Promise.resolve({status: 'error', code: 'UNSUPPORTED_PLATFORM', endpoints: []});
      const binary = path.join(resourcesPath, 'rpc-discovery', `${platform}-${arch}`, 'golos-rpc-directory-client' + (platform === 'win32' ? '.exe' : ''));
      if (!existsSync(binary)) return Promise.resolve({status: 'error', code: 'NATIVE_CLIENT_MISSING', endpoints: []});
      const configDir = path.join(userData, 'rpc-discovery');
      return new Promise(resolve => {
        const run = {child: null, failure: null, timer: null, forceTimer: null};
        active = run;
        let chunks = [], bytes = 0, stderrBytes = 0, done = false;
        const finish = (result, release = true) => {
          if (done) return; done = true;
          timerClear(run.timer); timerClear(run.forceTimer); timerClear(run.exitTimer);
          if (release) active = null;
          chunks = []; resolve(result);
        };
        const stop = code => {
          if (done || run.failure) return;
          run.failure = code;
          // Keep the global slot occupied until close: killed is not proof of exit.
          try { run.child.kill('SIGTERM'); } catch (_) {}
          run.forceTimer = timerSet(() => { if (!done) { try { run.child.kill('SIGKILL'); } catch (_) {} } }, 1000);
          run.exitTimer = timerSet(() => finish({status: 'error', code: 'STOP_FAILED', endpoints: []}, false), 2000);
        };
        run.stop = stop;
        try {
          mkdirSync(configDir, {recursive: true, mode: 0o700});
          run.child = spawn(binary, searchArgs(configDir), {shell: false, windowsHide: true, cwd: configDir, env, stdio: ['ignore', 'pipe', 'pipe']});
          run.child.stdout.on('data', chunk => {
            if (run.failure) return;
            const b = Buffer.from(chunk); bytes += b.length;
            if (bytes > MAX_BYTES) { chunks = []; stop('OUTPUT_LIMIT'); } else chunks.push(b);
          });
          run.child.stderr.on('data', chunk => { stderrBytes += Buffer.byteLength(chunk); if (stderrBytes > MAX_BYTES) stop('OUTPUT_LIMIT'); });
          run.child.on('error', () => { if (!run.child.pid) finish({status: 'error', code: 'SPAWN_FAILED', endpoints: []}); else stop('PROCESS_ERROR'); });
          run.child.once('close', (code, signal) => {
            if (active === run) active = null;
            if (done) return;
            if (run.failure) return finish({status: run.failure === 'CANCELED' ? 'canceled' : 'error', code: run.failure, endpoints: []});
            if (signal || ![0, 3].includes(code)) return finish({status: 'error', code: 'PROCESS_EXIT', endpoints: []});
            try {
              const endpoints = parseOutput(Buffer.concat(chunks));
              if ((code === 3 && endpoints.length) || (code === 0 && !endpoints.length)) throw Error('INVALID_OUTPUT');
              finish({status: endpoints.length ? 'done' : 'empty', endpoints});
            } catch (_) { finish({status: 'error', code: 'INVALID_OUTPUT', endpoints: []}); }
          });
          run.timer = timerSet(() => stop('TIMEOUT'), 18000);
        } catch (_) { finish({status: 'error', code: 'SPAWN_FAILED', endpoints: []}); }
      });
    },
    cancel() { if (active) active.stop('CANCELED'); },
    isBusy() { return active !== null; }
  };
}
module.exports = {createDiscovery, searchArgs, childEnvironment, validateEndpoint, parseOutput};
