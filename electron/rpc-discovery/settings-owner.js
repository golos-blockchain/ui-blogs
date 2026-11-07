'use strict';
const path = require('node:path');
const {validateEndpoint} = require('./adapter');
let installed;
const fields = ['ws_connection_client','img_proxy_prefix','use_img_proxy','auth_service','notify_service','notify_service_ws','elastic_search','main_app'];
function validateSettings(value) {
  const invalid = () => {throw Error('INVALID_SETTINGS');};
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== fields.length || Object.keys(value).some(k => !fields.includes(k))) invalid();
  for (const key of fields) {
    if (key === 'use_img_proxy') {if (typeof value[key] !== 'boolean') invalid();}
    else if (typeof value[key] !== 'string' || value[key].length > 2048 || /[\u0000-\u001f\u007f]/.test(value[key])) invalid();
  }
  if (!['blogs','wallet','msgs'].includes(value.main_app)) invalid();
  try {validateEndpoint(value.ws_connection_client);} catch (_) {invalid();}
  return value;
}
function installSettings({BrowserWindow,ipcMain}, options) {
  let win, candidate = null;
  const url = options.appUrl + '/__app_settings';
  function authorize(event) {
    if (!win || win.isDestroyed() || event.sender !== win.webContents || event.senderFrame !== win.webContents.mainFrame || event.senderFrame !== event.sender.mainFrame || event.sender.getURL() !== url) throw Error('FORBIDDEN');
  }
  function open() {
    if (win && !win.isDestroyed()) {win.focus(); return win;}
    const owned = new BrowserWindow({title:'Настройки',width:650,height:700,webPreferences:{preload:path.join(__dirname,'settings-preload.js'),sandbox:true,contextIsolation:true,nodeIntegration:false}});
    win=owned;
    owned.webContents.on('will-navigate',e=>e.preventDefault());
    owned.webContents.setWindowOpenHandler(()=>({action:'deny'}));
    owned.on('closed',()=>{if(win===owned){win=null;candidate=null;}});
    owned.loadURL(url);return owned;
  }
  ipcMain.handle('owned-settings:save',(event,value,...extra)=>{
    authorize(event);if(extra.length) throw Error('INVALID_SETTINGS');validateSettings(value);
    const cfg=options.cfg;
    const next={...cfg,ws_connection_client:value.ws_connection_client,main_app:value.main_app,
      ws_connection_app:[...cfg.ws_connection_app],
      images:{...cfg.images,img_proxy_prefix:value.img_proxy_prefix,use_img_proxy:value.use_img_proxy},
      auth_service:{...cfg.auth_service,host:value.auth_service},
      notify_service:{...cfg.notify_service,host:value.notify_service,host_ws:value.notify_service_ws},
      elastic_search:{...cfg.elastic_search,url:value.elastic_search}};
    if(!next.ws_connection_app.some(r=>r.address===value.ws_connection_client)) next.ws_connection_app.push({address:value.ws_connection_client});
    options.save(next);candidate=null;options.restart();return {status:'saved'};
  });
  ipcMain.on('owned-settings:candidate',(event,...args)=>{try {authorize(event);if(args.length) throw Error('FORBIDDEN');event.returnValue=candidate;}catch(_){event.returnValue=null;}});
  ipcMain.on('owned-settings:open',(_event,...args)=>{if(!args.length) open();});
  installed={open,authorize,openCandidate(value){candidate=validateEndpoint(value);if(win && !win.isDestroyed()) {win.loadURL(url);win.focus();return win;}return open();}};
  return installed;
}
function openSettings(){if(installed)return installed.open();}
module.exports={installSettings,openSettings,validateSettings};
