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

    win.webContents.on('zoom-changed', (e, zoomDirection) => {
        let zf = win.webContents.zoomFactor
        if (zoomDirection === 'in') {
            zf += 0.2
        } else if (zoomDirection === 'out') {
            zf -= 0.2
        }
        win.webContents.zoomFactor = zf
    })

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
        const notify_service = new URL(appSet.notify_service.host)
        const auth_service = new URL(appSet.auth_service.host)
        const app_updater = new URL(appSet.app_updater.host)
        const isSecureURL = (url) => {
            try {
                url = new URL(url)
                if (url.host === notify_service.host ||
                    url.host === auth_service.host ||
                    url.host === app_updater.host) {
                    return true
                }
                return false
            } catch (err) {
                console.error('CORS bypassing - cannot check URI', err)
                return false
            }
        }
        const isTrustedPage = (wc) => {
            if (!wc) {
                return false
            }
            try {
                let url = wc.getURL()
                if (!url) {
                    return false
                }
                url = new URL(url)
                return url.pathname.endsWith('/assets')
            } catch (err) {
                console.log(wc.getURL())
                console.error('CORS bypassing - cannot get page url', err)
                return false
            }
        }
        session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
            const { url, webContents, requestHeaders} = details
            if (isSecureURL(url) || isTrustedPage(webContents)) {
                upsertHeader(requestHeaders, 'Origin', httpsUrl)
            }
            callback({ requestHeaders })
        })
        session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
            const { url, webContents, responseHeaders} = details
            if (isSecureURL(url)|| isTrustedPage(webContents)) {
                 upsertHeader(responseHeaders, 'Access-Control-Allow-Origin', appUrl)
            }
            callback({ responseHeaders })
        })
    } catch (err) {
        console.error('CORS bypassing error:', err)
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
