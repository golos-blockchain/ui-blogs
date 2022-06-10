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

const isHttpsURL = (url) => {
    return url.startsWith(httpsUrl)
}
const isOwnUrl = (url) => {
    return isHttpsURL(url) || url.startsWith(appUrl) || isMsgsUrl(url)
}

let msgsHost
try {
    let url = new URL(appSet.messenger_service.host)
    if (url.protocol === 'app:') {
        msgsHost = url.host
    }
} catch (err) {
    console.error(err)
}

const isMsgsUrl = (url) => {
    return msgsHost && (url.startsWith('https:// ' + msgsHost) || url.startsWith('app://' + msgsHost))
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
        } else if (url.startsWith('https://')) {
            e.preventDefault()
            win.loadURL(url.replace('https://', 'app://'))
        }
    })

    win.webContents.setWindowOpenHandler(({ url }) => {
        if (!isOwnUrl(url)) {
            shell.openExternal(url)
        } else if (url.startsWith(appUrl + '/leave_page')
                || url.startsWith(appUrl + '/__app_update')
                || isMsgsUrl(url)) {
            let [width, height] = win.getSize()
            width = Math.max(width, 1000)
            height = Math.max(height, 500)
            return {
                action: 'allow',
                overrideBrowserWindowOptions: {
                    width,
                    height,
                    webPreferences: {
                        preload: __dirname + '/settings_preload.js'
                    }
                }
            }
        } else {
            win.loadURL(url.replace('https://', 'app://'))
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
        icon: __dirname + '/256x256.png',
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
        const getPageURL = (wc) => {
            let url
            try {
                url = wc.getURL()
                if (!url) {
                    return null
                }
                url = new URL(url)
                return url
            } catch (err) {
                console.error('Cannot get page url', err, url)
                return null
            }
        }
        const isTrustedPage = (url) => {
            return url.pathname.endsWith('/assets')
        }
        session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
            const { url, webContents, requestHeaders} = details
            const allow = (origin) => upsertHeader(requestHeaders, 'Origin', origin)
            const pageUrl = getPageURL(webContents)
            if (!pageUrl) {
                console.error('onBeforeSendHeaders - cannot get page url')
            } else {
                const isMsgs = pageUrl.host === msgsHost
                if (isSecureURL(url)) {
                    allow(isMsgs ? ('https://' + msgsHost) : httpsUrl)
                } else if (!isMsgs && isTrustedPage(pageUrl)) {
                    allow(httpsUrl)
                }
            }
            callback({ requestHeaders })
        })
        session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
            const { url, webContents, responseHeaders} = details
            const allow = (origin) => upsertHeader(responseHeaders, 'Access-Control-Allow-Origin', origin)
            const pageUrl = getPageURL(webContents)
            if (!pageUrl) {
                console.error('onHeadersReceived - cannot get page url')
            } else {
                const isMsgs = pageUrl.host === msgsHost
                if (isSecureURL(url)) {
                    allow(isMsgs ? ('app://' + msgsHost) : appUrl)
                } else if (!isMsgs && isTrustedPage(pageUrl)) {
                    allow(appUrl)
                }
            }
            callback({ responseHeaders })
        })
    } catch (err) {
        console.error('CORS bypassing error:', err)
    }

    protocol.registerFileProtocol('app', (request, callback) => {
        const msgs = isMsgsUrl(request.url)
        let pn = new URL(request.url).pathname
        if (!pn || pn === '/') {
            pn = '/index.html'
        }
        if (msgs) pn = '/msgs' + pn
        const p = path.normalize(`${__dirname}${pn}`)
        if (!fs.existsSync(p)) {
            pn = '/index.html'
            if (msgs) pn = '/msgs' + pn
            callback({ path: path.normalize(`${__dirname}${pn}`) })
            return
        }
        callback({ path: p})
    })

    let appMenu = initMenu(appUrl, httpsUrl, appSet, false)
    Menu.setApplicationMenu(appMenu)

    createWindow()
})
