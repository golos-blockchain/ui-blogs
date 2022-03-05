import renderApp from 'app/renderApp'
import golos from 'golos-lib-js'

import * as api from 'app/utils/APIWrapper'
import getState from 'app/utils/StateBuilder'
import { checkUpdates } from './appUpdater'
require('app/cookieHelper')

const appConfig = window.appSettings.load()

const initialState = {
    offchain: {
        config: {
            ...appConfig,
            blocked_users: [],
            blocked_posts: [],
            add_notify_site: {}
        },
        flash: {

        },
    },
}

window.$STM_Config = initialState.offchain.config
window.$STM_csrf = null // not used in app

async function initState() {
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

    try {
        $STM_Config.add_notify_site = await checkUpdates()
    } catch (err) {
        console.error('Cannot check updates', err)
        alert('Cannot check updates' + err)
    }

    const onchain = await getState(api, pathname, initialState.offchain)

    if (window.appSplash)
        window.appSplash.contentLoaded()

    return onchain
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

