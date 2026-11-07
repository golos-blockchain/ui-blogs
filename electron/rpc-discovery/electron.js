'use strict';
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {createDiscovery, validateEndpoint} = require('./adapter');
let installed;
function installDiscovery({app, BrowserWindow, ipcMain, dialog}, options) {
  const service = options.service || createDiscovery({resourcesPath: options.resourcesPath, userData: app.getPath('userData')});
  const page = path.join(__dirname, 'panel.html');
  let win, candidates = [], generation = 0;
  function open() {
    if (win && !win.isDestroyed()) { win.focus(); return win; }
    const owned = new BrowserWindow({title: 'Поиск RPC через P2P', width: 720, height: 560,
      webPreferences: {preload: path.join(__dirname, 'preload.js'), sandbox: true, contextIsolation: true, nodeIntegration: false}});
    win = owned;
    owned.webContents.on('will-navigate', e => e.preventDefault());
    owned.webContents.setWindowOpenHandler(() => ({action: 'deny'}));
    owned.on('closed', () => { candidates = []; generation++; service.cancel(); if (win === owned) win = null; });
    owned.loadFile(page);
    return owned;
  }
  function authorize(event, args) {
    if (args.length || !win || win.isDestroyed() || event.sender !== win.webContents || event.senderFrame !== win.webContents.mainFrame || event.senderFrame !== event.sender.mainFrame || event.sender.getURL() !== pathToFileURL(page).href) throw Error('FORBIDDEN');
  }
  ipcMain.handle('rpc-discovery:start', async (event, ...args) => {
    authorize(event, args); candidates = []; const run = ++generation;
    const result = await service.start();
    if (run === generation && result.status === 'done') candidates = result.endpoints.map(r => ({...r}));
    return run === generation ? result : {status: 'canceled', endpoints: []};
  });
  ipcMain.handle('rpc-discovery:cancel', (event, ...args) => { authorize(event, args); candidates = []; generation++; service.cancel(); return {status: 'canceling'}; });
  ipcMain.handle('rpc-discovery:select', async (event, index, ...args) => {
    authorize(event, args);
    if (!Number.isSafeInteger(index) || index < 0 || !candidates[index] || !options.settings || !dialog) throw Error('INVALID_SELECTION');
    const candidate = candidates[index], run = generation;
    if (candidate.expires <= Math.floor(Date.now()/1000)) throw Error('INVALID_SELECTION');
    // golos-lib-js chooses HTTP(S) or WS(S) transport from this URL; no health probe.
    const url = validateEndpoint(candidate.url);
    const choice = await dialog.showMessageBox(win, {type:'warning',title:'Выбрать RPC',
      message:'Это непроверенное объявление RPC. Сеть, доступность и ответы не проверены.',
      detail:url + '\nПродолжить в настройках? RPC изменится только после «Сохранить и перезапустить».',
      buttons:['Отмена','Продолжить в настройках'],defaultId:0,cancelId:0,noLink:true});
    authorize(event, []);
    if (run !== generation || candidate !== candidates[index]) throw Error('INVALID_SELECTION');
    if (choice.response !== 1) return {status:'canceled'};
    options.settings.openCandidate(url); return {status:'staged'};
  });
  ipcMain.on('rpc-discovery:open', (event, ...args) => {
    if (args.length || event.senderFrame !== event.sender.mainFrame) return;
    try { if (!options.settings) return; options.settings.authorize(event); } catch (_) { return; }
    open();
  });
  app.on('before-quit', () => service.cancel());
  installed = {open};
  return installed;
}
function openDiscovery() { if (installed) return installed.open(); }
module.exports = {installDiscovery, openDiscovery};
