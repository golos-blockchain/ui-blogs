'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events'),{pathToFileURL}=require('node:url');
const {installDiscovery}=require('../electron/rpc-discovery/electron');
test('B1 only explicit confirmed current main-owned result stages settings; search/cancel/reject never change RPC',async()=>{
 const handlers=new Map(),listeners=new Map(),staged=[];let answer=0,dialogs=0;
 class Window extends EventEmitter {constructor(){super();this.webContents=new EventEmitter();this.webContents.mainFrame={};this.webContents.getURL=()=>this.url;this.webContents.setWindowOpenHandler=()=>{};}loadFile(p){this.url=pathToFileURL(p).href;}isDestroyed(){return false;}focus(){}}
 const app=new EventEmitter();app.getPath=()=> 'fixture';
 const integration=installDiscovery({app,BrowserWindow:Window,ipcMain:{handle:(n,cb)=>handlers.set(n,cb),on:(n,cb)=>listeners.set(n,cb)},dialog:{showMessageBox:async(_win,options)=>{dialogs++;assert.match(options.message,/непроверенн/i);return {response:answer};}}},{appUrl:'app://golos.id',settings:{authorize(){throw Error('FORBIDDEN');},openCandidate:url=>staged.push(url)},service:{start:async()=>({status:'done',endpoints:[{url:'http://rpc.example/api',expires:4000000000,trust:'UNVERIFIED_PEER_ANNOUNCEMENT'}]}),cancel(){}}});
 const win=integration.open(),e={sender:win.webContents,senderFrame:win.webContents.mainFrame};
 await handlers.get('rpc-discovery:start')(e);assert.equal(staged.length,0);assert.equal(dialogs,0);
 const select=handlers.get('rpc-discovery:select');assert.equal(typeof select,'function','explicit choice handler exists');
 await assert.rejects(async()=>select(e,'http://attacker.example'),/INVALID_SELECTION/);
 await select(e,0);assert.equal(staged.length,0);assert.equal(dialogs,1);
 answer=1;await select(e,0);assert.deepEqual(staged,['http://rpc.example/api']);
 handlers.get('rpc-discovery:cancel')(e);
 await assert.rejects(async()=>select(e,0),/INVALID_SELECTION/);
 assert.equal(staged.length,1);
});
