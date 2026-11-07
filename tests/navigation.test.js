'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {EventEmitter} = require('node:events');

async function fixture() {
  const ipcMain = new EventEmitter(), exposed = {}, windows = [], external = [], payloads = [];
  class BrowserWindow {
    constructor(options) {
      this.options = options; windows.push(this);
      this.webContents = new EventEmitter();
      this.webContents.mainFrame = {url: 'app://golos.id/'};
      this.webContents.getURL = () => this.webContents.mainFrame.url;
      this.webContents.isDestroyed = () => false;
      this.webContents.setWindowOpenHandler = () => {};
      this.webContents.send = (channel, ...args) => ipcRenderer.emit(channel, {}, ...args);
    }
    isDestroyed() { return false; }
    loadURL(url) { this.webContents.mainFrame.url = url; return Promise.resolve(); }
  }
  const electron = {BrowserWindow, ipcMain, app: {whenReady: () => Promise.resolve(), on() {}},
    Menu: {buildFromTemplate: x => x, setApplicationMenu() {}}, protocol: {registerSchemesAsPrivileged() {}, handle() {}},
    shell: {openExternal: url => { external.push(url); return Promise.reject(new Error('OS failure')); }},
    contextBridge: {exposeInMainWorld: (name, value) => { exposed[name] = value; }}};
  const ipcRenderer = new EventEmitter();
  let event;
  ipcRenderer.send = (...args) => { payloads.push(args); ipcMain.emit(args[0], event, ...args.slice(1)); };
  electron.ipcRenderer = ipcRenderer;
  const filename = path.join(__dirname, '../electron/electron.js');
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {URL, console, process, __dirname: path.dirname(filename), require: name => {
    if (name === 'electron') return electron;
    if (name === './app_settings') return {init: () => ({site_domain: 'golos.id'}), saveSettings() {}};
    if (name === './rpc-discovery/settings-owner') return {installSettings: () => ({open() {}})};
    if (name === './rpc-discovery/electron') return {installDiscovery: () => ({open() {}})};
    return require(name);
  }});
  await new Promise(resolve => setImmediate(resolve));
  const win = windows[0], wc = win.webContents;
  event = {sender: wc, senderFrame: wc.mainFrame};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../electron/settings_preload.js'), 'utf8'), {require: () => electron});
  return {ipcMain, exposed, external, payloads, win, event, BrowserWindow};
}

test('actual preload payload reaches real main callback and routes ordinary SPA URLs', async () => {
  const f = await fixture(), routed = [];
  f.exposed.appNavigation.onRouter(url => routed.push(url));
  f.exposed.appNavigation.loadURL('app://golos.id/trending');
  assert.deepEqual(f.payloads, [['load-url', 'app://golos.id/trending', false]]);
  assert.equal(f.ipcMain.listenerCount('load-url'), 1, 'main must receive actual preload channel');
  assert.deepEqual(routed, ['app://golos.id/trending']);
});

test('real callback accepts HTTP(S), catches OS rejection and denies invalid authority or payloads', async () => {
  const f = await fixture(), routed = [];
  f.exposed.appNavigation.onRouter(url => routed.push(url));
  assert.equal(f.ipcMain.listenerCount('load-url'), 1);
  const emit = (event, ...args) => assert.doesNotThrow(() => f.ipcMain.emit('load-url', event, ...args));
  emit(f.event, 'https://example.org/path?q=1#ok', true);
  emit(f.event, 'http://example.org/', true);
  const other = new f.BrowserWindow({});
  for (const event of [{sender: other.webContents, senderFrame: other.webContents.mainFrame},
    {...f.event, senderFrame: {url: 'app://golos.id/'}}, {...f.event, senderFrame: null}, {}])
    emit(event, 'app://golos.id/trending', false);
  for (const url of ['app://golos.id/__app_settings', 'https://golos.id/', 'app://golos.id/a/../__app_settings']) {
    f.win.webContents.mainFrame.url = url;
    emit(f.event, 'app://golos.id/trending', false);
  }
  f.win.webContents.mainFrame.url = 'app://golos.id/';
  const getURL = f.win.webContents.getURL;
  f.win.webContents.getURL = () => 'app://golos.id/other';
  emit(f.event, 'app://golos.id/trending', false);
  f.win.webContents.getURL = getURL;
  for (const target of [f.win, f.win.webContents]) {
    const original = target.isDestroyed;
    target.isDestroyed = () => true;
    emit(f.event, 'app://golos.id/trending', false);
    target.isDestroyed = original;
  }
  emit(f.event);
  for (const url of [null, {}, 1, '', 'a'.repeat(8193), 'javascript:alert(1)', 'file:///a', 'app://wallet/', 'app://msgs/',
    'app://golos.id/__app_settings', 'app://golos.id/a/../__app_settings', 'app://user@golos.id/trending',
    'app://golos.id/\\evil', 'app://golos.id/\npost', 'https://user:pass@example.org/', 'https://example.org/\\a',
    'https://example.org/\n', 'mailto:a@example.org', 'https://example.org/%0a', 'https://example.org/%5c']) {
    emit(f.event, url, false); emit(f.event, url, true);
  }
  for (const flag of [undefined, null, 0, 'true', {}]) emit(f.event, 'app://golos.id/trending', flag);
  emit(f.event, 'app://golos.id/trending', false, 'extra');
  emit(f.event, 'https://example.org/', false);
  emit(f.event, 'app://golos.id/trending', true);
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(routed, []);
  assert.deepEqual(f.external, ['https://example.org/path?q=1#ok', 'http://example.org/']);
});
