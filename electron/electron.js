const { app, BrowserWindow, Menu, protocol, session, shell, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

const AppSettings = require('./app_settings')
const { createContextMenu } = require('./context_menu')
const { initMenu } = require('./menu')
const { createSplash } = require('./splash')
const windowState = require('./state_keeper')

const appSet = AppSettings.init()

let site_domain = appSet.site_domain
try {
    site_domain = new URL(site_domain).host
} catch (error) {}

const appUrl = 'app://' + site_domain
const httpsUrl = 'https://' + site_domain

const isOwnUrl = (url) => {
    return url.startsWith(httpsUrl) || url.startsWith(appUrl)
}

// events which need to be set for main window and for child windows
const setCommonWindowEvents = (win) => {
    createContextMenu(win)

    win.webContents.on('will-navigate', (e, url) => {
        if (!isOwnUrl(url)) {
            e.preventDefault()
            shell.openExternal(url)
        }
    })

    win.webContents.setWindowOpenHandler(({ url }) => {
        if (!isOwnUrl(url)) {
            shell.openExternal(url)
        } else if (url.startsWith(appUrl + '/leave_page')
                || url.startsWith(appUrl + '/__app_update')) {
            return {
                action: 'allow',
                overrideBrowserWindowOptions: {
                    webPreferences: {
                        preload: __dirname + '/settings_preload.js'
                    }
                }
            }
        } else {
            win.loadURL(url)
        }
        return { action: 'deny' }
    })

    win.webContents.on('did-create-window', (childWin) => {
        setCommonWindowEvents(childWin)
    })
}

const createWindow = () => {
    const winState = windowState('main', {
        width: 800,
        height: 600,
        isMaximized: true,
    })

    const splash = createSplash(appUrl)

    const win = new BrowserWindow({
        x: winState.x,
        y: winState.y,
        width: winState.width,
        height: winState.height,
        show: false,
        icon: __dirname + '/images/favicon.ico',
        webPreferences: {
            preload: __dirname + '/settings_preload.js'
        }
    })

    ipcMain.once('content-loaded', () => {
        if (winState.isMaximized) {
            win.maximize()
        }
        win.show()
        splash.close()
    })

    let menu = initMenu(appUrl, httpsUrl, appSet)
    win.setMenu(menu)

    setCommonWindowEvents(win)

    win.on('close', function() {
        winState.saveState(win)
    })

    win.loadURL(appUrl)
}

ipcMain.on('save-settings', (e, arg) => {
    AppSettings.saveSettings(arg)
    app.relaunch()
    app.exit()
})

const upsertHeader = (headers, key, val) => {
    const lowKey = key.toLowerCase()
    key = Object.keys(headers).find(k => k.toLowerCase() === lowKey) || key
    headers[key] = val
}

protocol.registerSchemesAsPrivileged([
{
    scheme: 'app', privileges: { bypassCSP: true, standard: true }
}])

app.whenReady().then(() => {
    try {
        let notify_service = new URL('*', appSet.notify_service.host).toString()
        let auth_service = new URL('*', appSet.auth_service.host).toString()
        let app_updater = new URL('*', appSet.app_updater.host).toString()
        const filter = {
            urls: [
                auth_service,
                notify_service,
                app_updater
            ]
        }
        session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
            upsertHeader(details.requestHeaders, 'Origin', httpsUrl)
            callback({ requestHeaders: details.requestHeaders })
        })
        session.defaultSession.webRequest.onHeadersReceived(filter, (details, callback) => {
            upsertHeader(details.responseHeaders, 'Access-Control-Allow-Origin', appUrl)
            callback({ responseHeaders: details.responseHeaders })
        })
    } catch (err) {
        console.error('Auth/Notify error:', err)
    }

    protocol.registerFileProtocol('app', (request, callback) => {
        let pn = new URL(request.url).pathname
        if (!pn || pn === '/') {
            pn = '/index.html'
        }
        const p = path.normalize(`${__dirname}${pn}`)
        if (!fs.existsSync(p)) {
            pn = '/index.html'
            callback({ path: path.normalize(`${__dirname}${pn}`) })
            return
        }
        callback({ path: p})
    })

    let appMenu = initMenu(appUrl, httpsUrl, appSet, false)
    Menu.setApplicationMenu(appMenu)

    createWindow()
})
