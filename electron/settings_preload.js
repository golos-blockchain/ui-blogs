const { app, contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('appSettings', {
    load: () => {
        return ipcRenderer.sendSync('get-settings')
    },
    save: (settings) => {
        ipcRenderer.send('save-settings', settings)
    }
})

contextBridge.exposeInMainWorld('appSplash', {
    contentLoaded() {
        ipcRenderer.send('content-loaded')
    }
})

contextBridge.exposeInMainWorld('appNavigation', {
    loadURL: (url, isExternal = false) => {
        ipcRenderer.send('load-url', url, isExternal)
    },
    onRouter: (cb) => {
        ipcRenderer.removeAllListeners('router-push')
        ipcRenderer.on('router-push', (event, url) => cb(url))
    }
})
