'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
test('standalone Blogs permits only WASM compilation without relaxing script evaluation or window isolation', () => {
  const source = fs.readFileSync(path.join(__dirname, '../electron/electron.js'), 'utf8');
  const match = source.match(/headers\.set\('Content-Security-Policy', "([^"]+)"\)/);
  assert.ok(match, 'actual app protocol must set CSP');
  const policy = Object.fromEntries(match[1].split(';').map(s => s.trim().split(/\s+/)).filter(a => a[0]).map(([key, ...values]) => [key, values]));
  assert.deepEqual(policy['script-src'], ["'self'", "'unsafe-inline'", "'wasm-unsafe-eval'"]);
  assert.ok(!Object.values(policy).flat().includes("'unsafe-eval'"));
  assert.deepEqual(policy['object-src'], ["'none'"]);
  assert.match(source, /webPreferences: \{preload: path\.join\(__dirname, 'settings_preload\.js'\), sandbox: true, contextIsolation: true, nodeIntegration: false\}/);
});
