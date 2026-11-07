'use strict';
const {app, BrowserWindow, Menu, protocol, net, ipcMain, shell, dialog} = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const {pathToFileURL} = require('node:url');
const AppSettings = require('./app_settings');
const cfg = AppSettings.init();
const appUrl = 'app://' + cfg.site_domain;
const settings = require('./rpc-discovery/settings-owner').installSettings({BrowserWindow, ipcMain}, {appUrl, cfg, save: AppSettings.saveSettings, restart: () => {app.relaunch(); app.exit();}});
const discovery = require('./rpc-discovery/electron').installDiscovery({app, BrowserWindow, ipcMain, dialog}, {appUrl, settings, resourcesPath: process.resourcesPath});
function own(url) { try { const u = new URL(url); return u.protocol === 'app:' && u.host === new URL(appUrl).host; } catch (_) { return false; } }
protocol.registerSchemesAsPrivileged([{scheme: 'app', privileges: {standard: true, secure: true, supportFetchAPI: true}}]);
app.whenReady().then(() => {
  protocol.handle('app', request => {
    if (!own(request.url)) return new Response('Not found', {status: 404});
    let pathname; try { pathname = decodeURIComponent(new URL(request.url).pathname); } catch (_) { return new Response('Bad path', {status: 400}); }
    const root = path.resolve(__dirname);
    let file = path.resolve(root, '.' + pathname);
    if (!file.startsWith(root + path.sep) && file !== root) return new Response('Not found', {status: 404});
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) file = path.join(root, 'index.html');
    // Never expose main-process scripts/config to pages through the app protocol.
    const relative = path.relative(root, file).replace(/\\/g, '/');
    if (relative !== 'index.html' && !/^(assets|images|locales)\//.test(relative)) return new Response('Not found', {status: 404});
    return net.fetch(pathToFileURL(file).href).then(response => {
      const headers = new Headers(response.headers);
      headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: http: https:; font-src 'self' data:; connect-src 'self' http: https: ws: wss:; media-src 'self' blob: http: https:; frame-src https:; object-src 'none'; base-uri 'self'; form-action 'self'");
      return new Response(response.body, {status: response.status, headers});
    });
  });
  const win = new BrowserWindow({title: 'Golos Blogs', width: 1100, height: 750,
    webPreferences: {preload: path.join(__dirname, 'settings_preload.js'), sandbox: true, contextIsolation: true, nodeIntegration: false}});
  win.webContents.on('will-navigate', (event, url) => { if (!own(url)) { event.preventDefault(); if (/^https?:\/\//.test(url)) shell.openExternal(url); } });
  win.webContents.setWindowOpenHandler(() => ({action: 'deny'}));
  // Navigation belongs only to the ordinary main window, never an owned panel.
  function navigationURL(value) {
    if (typeof value !== 'string' || !value || value.length > 8192 || /[\u0000-\u0020\u007f\\\\]|%(?:0[0-9a-f]|1[0-9a-f]|20|7f|5c)/i.test(value)) return null;
    try { const url = new URL(value); return url.username || url.password ? null : url; } catch (_) { return null; }
  }
  function ordinary(url) {
    if (!url || url.protocol !== 'app:' || url.host !== new URL(appUrl).host) return false;
    let pathname; try { pathname = decodeURIComponent(url.pathname); } catch (_) { return false; }
    return !pathname.startsWith('/__');
  }
  ipcMain.on('load-url', (event, ...args) => {
    try {
      if (args.length !== 2 || typeof args[1] !== 'boolean' || win.isDestroyed() || win.webContents.isDestroyed()) return;
      const contents = win.webContents;
      if (!event || event.sender !== contents || !event.senderFrame || event.senderFrame !== contents.mainFrame) return;
      const current = contents.getURL();
      if (event.senderFrame.url !== current || !ordinary(navigationURL(current))) return;
      const url = navigationURL(args[0]);
      if (!url) return;
      if (args[1]) {
        if (url.protocol !== 'https:' && url.protocol !== 'http:') return;
        Promise.resolve(shell.openExternal(url.href)).catch(() => {});
      } else if (ordinary(url)) {
        contents.send('router-push', url.href);
      }
    } catch (_) { /* Malformed/stale IPC and OS failures must not crash main. */ }
  });
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {label: 'Golos Blogs', submenu: [{label: 'Настройки', click: () => settings.open()}, {label: 'Найти RPC через P2P', click: () => discovery.open()}, {role: 'quit', label: 'Выход'}]},
    {label: 'Навигация', submenu: [{label: 'Блоги', click: () => win.loadURL(appUrl)}, {role: 'reload', label: 'Обновить'}, {role: 'zoomIn'}, {role: 'zoomOut'}]}
  ]));
  win.loadURL(appUrl);
});
app.on('window-all-closed', () => app.quit());
