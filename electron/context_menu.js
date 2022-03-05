const { Menu, clipboard } = require('electron')

function createContextMenu(win) {
    win.webContents.on('context-menu', (e, params) => {
        const { isEditable, editFlags } = params

        const hasText = !!params.selectionText.length

        let tpl = []
        if (params.linkURL && params.mediaType === 'none') {
            tpl = [
                {
                    label: 'Копировать адрес ссылки',
                    click: () => {
                        const linkURL = params.linkURL.replace('app://', 'https://')
                        if (process.platform === 'darwin') {
                            clipboard.writeBookmark(params.linkText, linkURL)
                        } else {
                            clipboard.writeText(linkURL)
                        }
                    }
                },
            ]
        }

        if (params.mediaType === 'image') {
            tpl = [
                {
                    label: 'Сохранить картинку как...',
                    click: () => {
                        const linkURL = params.srcURL.replace('app://', 'https://')
                        win.webContents.downloadURL(linkURL)
                    }
                },
                {
                    label: 'Копировать URL картинки',
                    click: () => {
                        const linkURL = params.srcURL.replace('app://', 'https://')
                        clipboard.writeText(linkURL)
                    }
                },
            ]
        }

        tpl = [
            ...tpl,
            {
                label: 'Вырезать',
                role: editFlags.canCut ? 'cut' : '',
                enabled: editFlags.canCut,
                accelerator: 'CmdOrCtrl+X',
                visible: isEditable,
            },
            {
                label: 'Копировать',
                role: editFlags.canCopy ? 'copy' : '',
                enabled: editFlags.canCopy,
                accelerator: 'CmdOrCtrl+C',
                visible: isEditable || hasText,
            },
            {
                label: 'Вставить',
                role: editFlags.canPaste ? 'paste' : '',
                enabled: editFlags.canPaste,
                accelerator: 'CmdOrCtrl+V',
                visible: isEditable,
            }
        ]

        const hasVisible = tpl.find(item => !(item.visible === false))

        if (hasVisible) {
            const menu = Menu.buildFromTemplate(tpl)

            menu.popup(win)
        }
    })
}

module.exports = {
    createContextMenu
}
