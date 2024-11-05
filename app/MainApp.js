import renderApp from 'app/renderApp'
import golos from 'golos-lib-js'
import tt from 'counterpart'

import * as api from 'app/utils/APIWrapper'
import getState from 'app/utils/StateBuilder'
import { addShortcut } from 'app/utils/app/ShortcutUtils'
import { checkUpdates } from 'app/utils/app/UpdateUtils'
import defaultCfg from 'app/app_cfg'
require('app/cookieHelper')

let appConfig
if (process.env.MOBILE_APP) {
    console.log('Loading app config...')
    let cfg = localStorage.getItem('app_settings')
    if (cfg) {
        try {
            cfg = JSON.parse(cfg)
            // Add here migrations
            cfg = { ...defaultCfg, ...cfg }
        } catch (err) {
            console.error('Cannot parse app_settings', err)
            cfg = defaultCfg
        }
    } else {
        cfg = defaultCfg
    }
    if (!cfg.ws_connection_client) {
        cfg.ws_connection_client = cfg.ws_connection_app[0].address
    }
    if (cfg.images.use_img_proxy === undefined) {
        cfg.images.use_img_proxy = true
    }
    cfg.app_version = defaultCfg.app_version
    appConfig = cfg
} else {
    appConfig = window.appSettings.load()
}

const initialState = {
    offchain: {
        config: {
            ...appConfig,
            blocked_users: [],
            blocked_posts: [],
            filter_apps: [],
            add_notify_site: {}
        },
        flash: {

        },
    },
}

window.$STM_Config = initialState.offchain.config
window.$STM_csrf = null // not used in app

function closeSplash() {
    try {
        if (process.env.MOBILE_APP) {
            navigator.splashscreen.hide()
        } else {
            window.appSplash.contentLoaded()
        }
    } catch (err) {
        console.error('closeSplash', err)
    }
}

function showNodeError() {
    alert(tt('app_settings.node_error_NODE', { NODE: $STM_Config.ws_connection_client }))
}

const showError = (err, label = '') => {
    if (!process.env.MOBILE_APP) return
    alert(label + ' error:\n'
        + (err && err.toString()) + '\n'
        + (err && JSON.stringify(err.stack))
    )
}

async function initState() {
    try {
        // these are need for getState
        await golos.importNativeLib();
        const config = initialState.offchain.config
        golos.config.set('websocket', config.ws_connection_client)
        if (config.chain_id)
            golos.config.set('chain_id', config.chain_id)

        const { pathname } = window.location
        if (pathname.startsWith('/__app_')) {
            return {
                content: {}
            }
        }

        // First add - for case if all failed at all, and not rendering
        if (process.env.MOBILE_APP) {
            await addShortcut({
                id: 'the_settings',
                shortLabel: 'Настройки',
                longLabel: 'Настройки',
                hash: '#app-settings'
            })
        }

        let splashTimeout = setTimeout(() => {
            closeSplash()
            showNodeError()
        }, 30000)

        const doUpdate = Math.random() > 0.7
        if (doUpdate) {
            try {
                $STM_Config.add_notify_site = await checkUpdates()
            } catch (err) {
                console.error('Cannot check updates', err)
                clearTimeout(splashTimeout)
                closeSplash()
                alert('Cannot check updates' + err)
                //showError(err, 'Cannot check updates')
            }
        }

        let onchain
        let nodeError = null
        try {
            onchain = await getState(api, pathname, initialState.offchain)
        } catch (error) {
            nodeError = error
        }

        clearTimeout(splashTimeout)
        closeSplash()

        if (nodeError) {
            showNodeError()
            throw nodeError
        }

        return onchain
    } catch (err) {
        showError(err, 'initState')
    }
}

initState().then((onchain) => {
    initialState.global = onchain

    if (!window.Intl) {
        require.ensure(
            ['intl/dist/Intl'],
            (require) => {
                window.IntlPolyfill = window.Intl = require('intl/dist/Intl')
                require('intl/locale-data/jsonp/en-US.js')
                renderApp(initialState)
            },
            'IntlBundle'
        )
    } else {
        renderApp(initialState)
    }
})

