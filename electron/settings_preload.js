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
