const { BrowserWindow, shell, Menu } = require('electron')

function initMenu(appUrl, full = true) {
    let template = [
        {
            label: 'Обновить',
            role: 'forceReload'
        },
        {
            role: 'help',
            label: 'Помощь',
            submenu: [
                {
                    label: 'Сообщить о проблеме',
                    click: () => {
                        shell.openExternal('https://golos.chatbro.com')
                    }
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Открыть логи',
                    click: (menu, win) => { // Used instead of role, because works even if devtools are disconnected
                        win.toggleDevTools()
                    }
                },
                {
                    label: 'GOLOS Blogs 1.0.0',
                    enabled: false,
                }
            ]
        },
    ]
    if (full)
    	template = [
            {
                label: '< Назад',
                click: (item, win, e) => {
                    win.webContents.goBack()
                }
            },
            {
                label: 'Вперед >',
                click: (item, win, e) => {
                    win.webContents.goForward()
                }
            },
            template[0], // Обновить
            {
                label: 'Настройки',
                click: (item, win, e) => {
                    const settings = new BrowserWindow({
                        parent: win,
                        modal: true,
                        resizable: false,
                        width: 600,
                        height: 475,
                        webPreferences: {
                            preload: __dirname + '/settings_preload.js'
                        }
                    })
                    settings.loadURL(appUrl + '/__app_settings')
                }
            },
            template[1], // Помощь
        ]
    const menu = Menu.buildFromTemplate(template)
    return menu
}

module.exports = {
    initMenu
}
