const { app, BrowserWindow } = require('electron')

function createSplash(appUrl) {
    const win = new BrowserWindow({
        width: 300,
        height: 300,
        frame: false,
        resizable: false,
        center: true,
        show: false,
        icon: __dirname + '/256x256.png',
        webPreferences: {
            preload: __dirname + '/settings_preload.js'
        }
    })

    win.loadURL(appUrl + '/__app_splash')

    win.webContents.once('did-finish-load', () => {
        win.show()
    })

    let shouldQuit = true

    const appQuiter = () => {
        if (shouldQuit)
            app.quit()
    }

    win.once('closed', appQuiter)

    return {
        win,
        close: () => {
            shouldQuit = false
            win.off('closed', appQuiter)
            win.close()
        }
    }
}

module.exports = {
    createSplash
}
