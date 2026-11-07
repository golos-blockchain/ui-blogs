'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {EventEmitter} = require('node:events');
const {installSettings} = require('../electron/rpc-discovery/settings-owner');
function fixture() {
  const handlers = new Map(), listeners = new Map(); let saved, restarts = 0;
  const cfg = {ws_connection_client:'wss://old.example/ws', ws_connection_app:[{address:'wss://old.example/ws'}], images:{use_img_proxy:true,img_proxy_prefix:'https://img.example/'},auth_service:{host:'https://auth.example'},notify_service:{host:'https://notify.example',host_ws:'wss://notify.example'},elastic_search:{url:'https://search.example'},main_app:'blogs', immutable:'keep'};
  class Window extends EventEmitter {
    constructor(options) {super(); this.options=options; this.webContents=new EventEmitter(); this.webContents.mainFrame={}; this.webContents.setWindowOpenHandler=()=>{};this.webContents.getURL=()=>this.url;}
    loadURL(url) {this.url=url;this.webContents.mainFrame.url=url;} isDestroyed(){return false;} focus(){}
  }
  const owner=installSettings({BrowserWindow:Window,ipcMain:{handle:(n,f)=>handlers.set(n,f),on:(n,f)=>listeners.set(n,f)}},{appUrl:'app://golos.id',cfg,save:value=>{saved=JSON.parse(JSON.stringify(value));},restart:()=>restarts++});
  const win=owner.open(); const event={sender:win.webContents,senderFrame:win.webContents.mainFrame};
  const value={ws_connection_client:'http://chosen.example/rpc',img_proxy_prefix:'https://img.example/',use_img_proxy:true,auth_service:'https://auth.example',notify_service:'https://notify.example',notify_service_ws:'wss://notify.example',elastic_search:'https://search.example',main_app:'blogs'};
  return {owner,win,event,value,handlers,listeners,cfg,saved:()=>saved,restarts:()=>restarts};
}
test('S1 history-spoofed ordinary Blogs webContents cannot save; owned main frame can',async()=>{
  const f=fixture();const frame={url:'app://golos.id/__app_settings'};
  await assert.rejects(async()=>f.handlers.get('owned-settings:save')({sender:{mainFrame:frame,getURL:()=>frame.url},senderFrame:frame},f.value),/FORBIDDEN/);
  await assert.rejects(async()=>f.handlers.get('owned-settings:save')({...f.event,senderFrame:{}},f.value),/FORBIDDEN/);
  assert.equal(f.saved(),undefined);
  await f.handlers.get('owned-settings:save')(f.event,f.value);
  assert.equal(f.saved().ws_connection_client,f.value.ws_connection_client);assert.equal(f.saved().immutable,'keep');assert.equal(f.restarts(),1);
});
test('S1 schema rejects unknown top-level/nested fields and invalid types without writing',async()=>{
  const f=fixture();
  for(const value of [{...f.value,private_key:'secret'},{...f.value,images:{evil:true}},{...f.value,use_img_proxy:'yes'},{...f.value,ws_connection_client:'file:///secret'},{...f.value,main_app:'evil'}]) {
    await assert.rejects(async()=>f.handlers.get('owned-settings:save')(f.event,value),/INVALID_SETTINGS/);
  }
  assert.equal(f.saved(),undefined);
});
test('B1 staging never changes loaded/current config; only actual settings Save persists candidate',async()=>{
 const f=fixture();f.owner.openCandidate('https://chosen.example/rpc');
 assert.equal(f.saved(),undefined);assert.equal(f.cfg.ws_connection_client,'wss://old.example/ws');
 const e={...f.event};f.listeners.get('owned-settings:candidate')(e);assert.equal(e.returnValue,'https://chosen.example/rpc');
 await f.handlers.get('owned-settings:save')(f.event,{...f.value,ws_connection_client:e.returnValue});
 assert.equal(f.saved().ws_connection_client,'https://chosen.example/rpc');
 // Same persisted config is consumed by the existing startup settings loader after restart.
 const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');const mod={exports:{}};const callbacks=new Map();
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../electron/app_settings.js'),'utf8'),{module:mod,process:{platform:'win32'},require:name=>name==='electron'?{app:{getPath:()=> 'fixture'},ipcMain:{on:(n,cb)=>callbacks.set(n,cb)}}:name==='fs'?{readFileSync:()=>JSON.stringify(f.saved())}:{images:{},ws_connection_app:[{address:'wss://default.example'}]}});
 assert.equal(mod.exports.init().ws_connection_client,'https://chosen.example/rpc');
});
