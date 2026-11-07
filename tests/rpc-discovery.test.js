'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const path = require('node:path');
const { createDiscovery, parseOutput } = require('../electron/rpc-discovery/adapter');
const { installDiscovery } = require('../electron/rpc-discovery/electron');
const { pathToFileURL } = require('node:url');
const TRUST = 'UNVERIFIED_PEER_ANNOUNCEMENT';
const row = url => ({url, expires: 4000000000, trust: TRUST});
test('parse bounded unverified directory; reject malformed, expired and unsafe URL syntax', () => {
  assert.deepEqual(parseOutput(Buffer.from(JSON.stringify([row('wss://rpc.example/ws'), row('wss://rpc.example/ws')]))), [row('wss://rpc.example/ws')]);
  for (const value of ['{}', 'oops', JSON.stringify([row('file:///C:/secret')]), JSON.stringify([row('https://user:password@rpc.example')]), JSON.stringify([row('https://rpc.example/#secret')]), JSON.stringify([{...row('https://rpc.example'), expires: 1}]), JSON.stringify([{...row('https://rpc.example'), trust: 'VERIFIED'}]), JSON.stringify(Array(65).fill(row('wss://rpc.example')))]) {
    assert.throws(() => parseOutput(Buffer.from(value)), /INVALID_OUTPUT/);
  }
});
test('actual IPC callbacks restrict dedicated window/main frame and reject renderer arguments', async () => {
  const handlers = new Map(); const callbacks = new Map(); let starts = 0, cancels = 0;
  class Window extends EventEmitter {
    constructor(options) { super(); this.options = options; this.webContents = new EventEmitter(); this.webContents.mainFrame = {}; this.webContents.getURL = () => this.url; this.webContents.setWindowOpenHandler = () => {}; }
    loadFile(file) { this.url = pathToFileURL(file).href; } isDestroyed() { return false; } focus() {}
  }
  const app = new EventEmitter(); app.getPath = () => 'C:/fixture/profile';
  const integration = installDiscovery({app, BrowserWindow: Window, ipcMain: {handle: (n, cb) => handlers.set(n, cb), on: (n, cb) => callbacks.set(n, cb)}}, {resourcesPath: 'C:/fixture', appUrl: 'app://golos.id', service: {start: async () => { starts++; return {status: 'empty', endpoints: []}; }, cancel: () => cancels++}});
  const win = integration.open(); const event = {sender: win.webContents, senderFrame: win.webContents.mainFrame};
  assert.equal(win.options.webPreferences.sandbox, true); assert.equal(win.options.webPreferences.contextIsolation, true); assert.equal(win.options.webPreferences.nodeIntegration, false);
  assert.deepEqual(await handlers.get('rpc-discovery:start')(event), {status: 'empty', endpoints: []});
  assert.equal(starts, 1);
  await assert.rejects(async () => handlers.get('rpc-discovery:start')({...event, senderFrame: {}}), /FORBIDDEN/);
  await assert.rejects(async () => handlers.get('rpc-discovery:start')(event, {binary: 'golosd'}), /FORBIDDEN/);
  handlers.get('rpc-discovery:cancel')(event); assert.equal(cancels, 1);
  win.emit('closed'); assert.equal(cancels, 2);
});
test('missing binary fails explicitly without spawning', async () => {
  const f = fixture({existsSync: () => false});
  assert.equal((await f.service.start()).code, 'NATIVE_CLIENT_MISSING'); assert.equal(f.invocation(), undefined);
});
test('concurrency, cancellation, exit, error, bounded streams and deadline', async () => {
  for (const kind of ['cancel', 'stdout', 'stderr', 'timeout', 'exit', 'error', 'invalid', 'success', 'split']) {
    const timers = [];
    const f = fixture({setTimeout: (fn, ms) => { timers.push({fn, ms}); return fn; }, clearTimeout: () => {}});
    const pending = f.service.start();
    assert.equal((await f.service.start()).code, 'BUSY');
    if (kind === 'cancel') f.service.cancel();
    if (kind === 'stdout') f.child.stdout.emit('data', Buffer.alloc(65537));
    if (kind === 'stderr') f.child.stderr.emit('data', Buffer.alloc(65537));
    if (kind === 'timeout') timers.find(t => t.ms === 18000).fn();
    if (['cancel','stdout','stderr','timeout'].includes(kind)) { assert.equal(f.child.killed, true); assert.equal(f.service.isBusy(), true); }
    if (kind === 'invalid') f.child.stdout.emit('data', Buffer.from('{}'));
    if (kind === 'success' || kind === 'split') {
      const bytes = Buffer.from(JSON.stringify([row('wss://rpc.example/ws')]));
      if (kind === 'split') { f.child.stdout.emit('data', bytes.subarray(0, 17)); f.child.stdout.emit('data', bytes.subarray(17)); } else f.child.stdout.emit('data', bytes);
    }
    if (kind === 'error') f.child.emit('error', Error('private native diagnostics'));
    else f.child.emit('close', kind === 'exit' ? 1 : 0, null);
    const result = await pending;
    const expected = {cancel: 'CANCELED', stdout: 'OUTPUT_LIMIT', stderr: 'OUTPUT_LIMIT', timeout: 'TIMEOUT', exit: 'PROCESS_EXIT', error: 'SPAWN_FAILED', invalid: 'INVALID_OUTPUT'}[kind];
    if (expected) assert.equal(result.code, expected); else assert.equal(result.status, 'done');
    assert.equal(f.service.isBusy(), false);
    assert.ok(!JSON.stringify(result).includes('private native'));
  }
});
const vm = require('node:vm');
const fs = require('node:fs');
test('actual panel callbacks show progress/results and never save or connect', async () => {
  const elements = new Map();
  function element() { return {textContent: '', disabled: false, children: [], appendChild(e) { this.children.push(e); }, replaceChildren() {this.children=[];}, setAttribute() {}, focus() {}, addEventListener(name, fn) {this[name]=fn;}}; }
  for (const id of ['find', 'cancel', 'status', 'results']) elements.set(id, element());
  let resolve, canceled = 0; const selected=[];
  const api = {start: () => new Promise(r => resolve=r), cancel: async () => { canceled++; }, select: async index => {selected.push(index);return {status:'staged'};}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../electron/rpc-discovery/panel.js'), 'utf8'), {document: {getElementById: id => elements.get(id), createElement: () => element()}, window: {rpcDiscovery: api}});
  const p = elements.get('find').click();
  assert.equal(elements.get('find').disabled, true); assert.match(elements.get('status').textContent, /Поиск/);
  await elements.get('cancel').click(); assert.equal(canceled, 1);
  resolve({status: 'done', endpoints: [row('wss://rpc.example/ws')]}); await p;
  assert.equal(elements.get('results').children.length, 1); assert.match(elements.get('status').textContent, /непроверенн/i);
  assert.equal(selected.length,0);
  const choose=elements.get('results').children[0].children[1]; assert.equal(choose.textContent,'Выбрать RPC');
  await choose.click(); assert.deepEqual(selected,[0]);assert.match(elements.get('status').textContent,/настройки/);
  const p2 = elements.get('find').click(); resolve({status: 'empty', endpoints: []}); await p2;
  assert.match(elements.get('status').textContent, /не найден/i);
  const p3 = elements.get('find').click(); resolve({status: 'error', code: 'NATIVE_CLIENT_MISSING', endpoints: []}); await p3;
  assert.match(elements.get('status').textContent, /не включён/);
});
test('termination failure resolves visibly but holds concurrency slot until actual close', async () => {
  const timers = [];
  const f = fixture({setTimeout: (fn, ms) => {timers.push({fn, ms}); return fn;}, clearTimeout: () => {}});
  const pending = f.service.start(); f.service.cancel();
  timers.find(t => t.ms === 1000).fn();
  const last = timers.find(t => t.ms === 2000); assert.ok(last, 'final termination watchdog must exist'); last.fn();
  assert.equal((await pending).code, 'STOP_FAILED'); assert.equal(f.service.isBusy(), true);
  assert.equal((await f.service.start()).code, 'BUSY');
  f.child.emit('close', null, 'SIGKILL'); assert.equal(f.service.isBusy(), false);
});
test('actual settings load/save callbacks preserve local/public/custom selections through discovery', async () => {
  for (const selected of ['ws://127.0.0.1:8090', 'wss://rpc.example/ws', 'wss://custom.example/ws']) {
    let stored = JSON.stringify({ws_connection_client: selected}); const handlers = new Map(); const module = {exports: {}};
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../electron/app_settings.js'), 'utf8'), {module, process: {platform: 'win32'}, require: name => {
      if (name === 'electron') return {app: {getPath: () => 'C:/fixture'}, ipcMain: {on: (n, cb) => handlers.set(n, cb)}};
      if (name === 'fs') return {readFileSync: () => stored, writeFileSync: (p, v) => {stored=v;}};
      if (name === './default_cfg.js') return {images: {}, ws_connection_app: [{address: 'wss://default.example/ws'}]};
      throw Error(name);
    }});
    module.exports.init(); const event = {}; handlers.get('get-settings')(event); assert.equal(event.returnValue.ws_connection_client, selected);
    const f = fixture(); const pending = f.service.start(); f.child.stdout.emit('data', Buffer.from('[]')); f.child.emit('close', 3); await pending;
    assert.equal(JSON.parse(stored).ws_connection_client, selected);
    module.exports.saveSettings(event.returnValue); assert.equal(JSON.parse(stored).ws_connection_client, selected);
  }
});
test('real preload exposes only argument-free discovery capabilities', async () => {
  const exposed = {}; const sent = [];
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../electron/rpc-discovery/preload.js'), 'utf8'), {require: () => ({contextBridge: {exposeInMainWorld: (name, api) => exposed[name] = api}, ipcRenderer: {invoke: (...args) => {sent.push(args);}}})});
  exposed.rpcDiscovery.start({command: 'golosd'}); exposed.rpcDiscovery.cancel('anything');
  assert.deepEqual(sent, [['rpc-discovery:start'], ['rpc-discovery:cancel']]);
});
test('settings panel open only permits actual app settings main frame', () => {
  const handlers = new Map(); const callbacks = new Map(); let windows = 0;
  class Window extends EventEmitter { constructor() { super(); windows++; this.webContents = new EventEmitter(); this.webContents.setWindowOpenHandler = () => {}; } loadFile() {} isDestroyed() {return false;} focus() {} }
  const app = new EventEmitter(); app.getPath = () => 'C:/fixture';
  let authorizedSender;
  installDiscovery({app, BrowserWindow: Window, ipcMain: {handle: (n, cb) => handlers.set(n, cb), on: (n, cb) => callbacks.set(n, cb)}}, {appUrl: 'app://golos.id', settings: {authorize: event => {if(event.sender !== authorizedSender) throw Error('FORBIDDEN');}}, service: {cancel() {}, start() {}}});
  const open = callbacks.get('rpc-discovery:open');
  for (const url of ['https://golos.id/__app_settings', 'app://golos.id.evil/__app_settings', 'app://golos.id/blog']) {const frame={url}; open({sender:{mainFrame:frame}, senderFrame:frame});}
  assert.equal(windows, 0);
  const frame={url:'app://golos.id/__app_settings'}; open({sender:{mainFrame:frame}, senderFrame:frame}); assert.equal(windows, 0);
  authorizedSender={mainFrame:frame}; open({sender:authorizedSender, senderFrame:frame}); assert.equal(windows, 1);
});
test('packaging hook rejects missing native artifact instead of releasing a fake runtime', () => {
  const {verifyNative} = require('../electron/rpc-discovery/before-pack');
  assert.throws(() => verifyNative(path.join(__dirname, 'absent-native-fixture'), 'win32', 'x64'), /artifact\/provenance missing/);
});
function fixture(extra = {}) {
  const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
  child.kill = () => { child.killed = true; };
  let invocation;
  const service = createDiscovery({ resourcesPath: 'C:/fixture/resources', userData: 'C:/fixture/profile', platform: 'win32', arch: 'x64',
    existsSync: () => true, mkdirSync: () => {}, spawn: (...args) => { invocation = args; return child; }, ...extra });
  return {service, child, invocation: () => invocation};
}
test('fixed native command, bounded args and secret-free OS environment', async () => {
  const f = fixture({ env: { SystemRoot: 'C:/Windows', USERPROFILE: 'C:/fixture/profile', TMP: 'C:/fixture/tmp', OPENAI_API_KEY: 'secret', NODE_OPTIONS: '--inspect' } });
  const pending = f.service.start();
  const [binary, args, options] = f.invocation();
  assert.equal(binary, path.join('C:/fixture/resources', 'rpc-discovery', 'win32-x64', 'golos-rpc-directory-client.exe'));
  assert.equal(options.shell, false);
  assert.equal(options.env.TMP, 'C:/fixture/tmp'); assert.equal(options.env.USERPROFILE, 'C:/fixture/profile');
  assert.equal(options.env.OPENAI_API_KEY, undefined); assert.equal(options.env.NODE_OPTIONS, undefined);
  assert.deepEqual(args, ['--search', path.join('C:/fixture/profile', 'rpc-discovery'), '15']);
  f.child.stdout.emit('data', Buffer.from('[]')); f.child.emit('close', 3, null);
  assert.deepEqual(await pending, {status: 'empty', endpoints: []});
});
