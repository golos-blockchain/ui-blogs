'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {EventEmitter}=require('node:events');
function fixture(){
 const exposed={},ipc=new EventEmitter(),calls=[];
 ipc.send=(...args)=>calls.push(['send',...args]);ipc.sendSync=(...args)=>calls.push(['sync',...args]);ipc.invoke=(...args)=>{calls.push(['invoke',...args]);return Promise.resolve();};
 const source=path.join(__dirname,'../electron/rpc-discovery/settings-preload.js');
 vm.runInNewContext(fs.readFileSync(source,'utf8'),{URL,location:{href:'app://golos.id/__app_settings'},require:name=>{assert.equal(name,'electron');return {contextBridge:{exposeInMainWorld:(n,v)=>exposed[n]=v},ipcRenderer:ipc};}});
 return {exposed,ipc,calls};
}
test('actual dedicated preload delivers owned settings router URL without IPC event or write/navigation capability',()=>{
 const {exposed,ipc,calls}=fixture();
 assert.equal(typeof exposed.appNavigation?.onRouter,'function');
 assert.deepEqual(Object.keys(exposed.appNavigation),['onRouter']);
 const delivered=[];exposed.appNavigation.onRouter((...args)=>delivered.push(args));
 const event={sender:{privileged:true}};ipc.emit('router-push',event,'app://golos.id/__app_settings');
 assert.deepEqual(delivered,[['app://golos.id/__app_settings']]);
 assert.deepEqual(calls,[]);
 assert.deepEqual(Object.keys(exposed.appSettings),['load','candidate','save']);
 exposed.appSettings.save({ws_connection_client:'https://rpc.example.org'});
 assert.deepEqual(calls,[['invoke','owned-settings:save',{ws_connection_client:'https://rpc.example.org'}]]);
});
test('router validates callbacks and exact owned URLs; replaces/unsubscribes only its own listener',()=>{
 const {exposed,ipc}=fixture(), nav=exposed.appNavigation, first=[],second=[];
 const other=()=>{};ipc.on('router-push',other);
 const stopFirst=nav.onRouter(url=>first.push(url));
 for(const cb of [null,undefined,{},'callback']) assert.throws(()=>nav.onRouter(cb),/callback/);
 for(const url of [null,{},123,'app://golos.id/@user/post','https://evil.example/__app_settings','app://golos.id/__app_settings?next=post','app://golos.id/__app_settings#post','app://golos.id/other/../__app_settings']) ipc.emit('router-push',{},url);
 assert.deepEqual(first,[]);
 const stopSecond=nav.onRouter(url=>second.push(url));
 assert.equal(ipc.listenerCount('router-push'),2);
 stopFirst();ipc.emit('router-push',{},'app://golos.id/__app_settings');
 assert.deepEqual(first,[]);assert.deepEqual(second,['app://golos.id/__app_settings']);
 stopSecond();stopSecond();assert.equal(ipc.listenerCount('router-push'),1);
});
