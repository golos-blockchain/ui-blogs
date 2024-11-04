
async function getShorcuts() {
    let i = 0
    for (let i = 0; i < 5; ++i) {
        if (!window.plugins || !window.plugins.Shortcuts) {
            await new Promise(resolve => setTimeout(resolve, 50))
            continue
        }
        const { Shortcuts } = window.plugins
        return Shortcuts
    }
    return null
}

async function dynShortcutsSupported() {
    const Shortcuts = await getShorcuts()
    return await new Promise(async (resolve, reject) => {
        Shortcuts.supportsDynamic((supported) => {
            resolve(supported)
        }, (err) => {
            reject(err)
        })
    })
}

async function setDynShortcut(shortcut) {
    const Shortcuts = await getShorcuts()
    await new Promise(async (resolve, reject) => {
        Shortcuts.setDynamic([shortcut], () => {
            resolve()
        }, (err) => {
            reject(err)
        })
    })
}

export async function addShortcut({ id, shortLabel, longLabel, hash }) {
    try {
        let shortcutSupport = await dynShortcutsSupported()
        if (!shortcutSupport) {
            console.error('Cannot add shortcut - not supported')
            return
        }
        let shortcut = {
            id,
            shortLabel,
            longLabel,
            iconFromResource: 'blg_setting',
            intent: {
                action: 'android.intent.action.RUN',
                flags: 67108864, // FLAG_ACTIVITY_CLEAR_TOP
                extras: {
                    id: Math.random().toString(),
                    hash
                }
            }
        }
        await setDynShortcut(shortcut)
        console.log('Shortcut successfully created')
    } catch (err) {
        console.error('Adding shortcut failed with', err)
    }
}

export async function getShortcutIntent() {
    const Shortcuts = await getShorcuts()
    return await new Promise((resolve, reject) => {
        try {
            Shortcuts.getIntent(intent => {
                resolve(intent)
            })
        } catch (err) {
            reject(err)
        }
    })
}

export async function onShortcutIntent(handler) {
    const Shortcuts = await getShorcuts()
    Shortcuts.onNewIntent()
    Shortcuts.onNewIntent((intent) => {
        handler(intent)
    })
}
