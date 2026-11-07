'use strict';
const {contextBridge, ipcRenderer} = require('electron');
contextBridge.exposeInMainWorld('rpcDiscovery', Object.freeze({start: () => ipcRenderer.invoke('rpc-discovery:start'), cancel: () => ipcRenderer.invoke('rpc-discovery:cancel'), select: index => ipcRenderer.invoke('rpc-discovery:select', index)}));
