'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('appSettings',Object.freeze({
  load:()=>ipcRenderer.sendSync('get-settings'),
  candidate:()=>ipcRenderer.sendSync('owned-settings:candidate'),
  save:value=>ipcRenderer.invoke('owned-settings:save',value)
}));
contextBridge.exposeInMainWorld('rpcDiscoveryPanel',Object.freeze({open:()=>ipcRenderer.send('rpc-discovery:open')}));
contextBridge.exposeInMainWorld('appSplash',Object.freeze({contentLoaded:()=>{}}));
// URLLoader requires a real router subscription. Never route the privileged
// settings renderer to posts: only the exact initial owned URL may be delivered.
const ownedSettingsUrl=location.href;
let routerListener;
contextBridge.exposeInMainWorld('appNavigation',Object.freeze({
  onRouter:callback=>{
    if(typeof callback!=='function') throw new TypeError('router callback must be a function');
    if(routerListener) ipcRenderer.removeListener('router-push',routerListener);
    const listener=(_event,url)=>{
      if(typeof url!=='string' || url!==ownedSettingsUrl) return;
      try {if(new URL(url).pathname!=='/__app_settings' || new URL(url).search || new URL(url).hash) return;} catch(_){return;}
      callback(url);
    };
    routerListener=listener;
    ipcRenderer.on('router-push',listener);
    return ()=>{
      ipcRenderer.removeListener('router-push',listener);
      if(routerListener===listener) routerListener=undefined;
    };
  }
}));
