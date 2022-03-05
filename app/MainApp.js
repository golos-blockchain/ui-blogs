import renderApp from 'app/renderApp'
import golos from 'golos-lib-js'
import semver from 'semver'
import tt from 'counterpart'

import { version } from '../package.json'
import * as api from 'app/utils/APIWrapper'
import getState from 'app/utils/StateBuilder'
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

async function checkUpdates() {
    const url = new URL(
        '/blogs-' + ($STM_Config.platform === 'linux' ? 'linux' : 'win'),
        $STM_Config.app_updater.host
    ).toString()
    let res = await fetch(url)
    res = await res.text()
    const doc = document.createElement('html')
    doc.innerHTML = res
    let files = []
    let links = doc.getElementsByTagName('a')
    let maxItem
    if (links) {
        for (let i = 0; i < links.length && i < 50; ++i) {
            const link = links[i]
            const href = link.getAttribute('href')
            if (!href.startsWith('glsblogs')) continue
            const [ productName, _rest ] = href.split('-')
            if (!_rest) continue
            const verParts = _rest.split('.')
            const ext = verParts.pop()
            let curVer = verParts.join('.')
            if (verParts.length === 2) {
                curVer += '.0'
            }
            if (semver.gte(version, curVer)) {
                continue
            }
            if (!maxItem || semver.gt(curVer, maxItem.version)) {
                maxItem = { version: curVer, txt: '' }
                maxItem[ext === 'txt' ? 'txt' : 'exe'] = href
            } else if (semver.eq(curVer, maxItem.version)) {
                maxItem[ext === 'txt' ? 'txt' : 'exe'] = href
            }
        }
    }
    if (maxItem && maxItem.exe) {
        $STM_Config.add_notify_site = {
            show: true,
            id: maxItem.version,
            link: '/__app_update?v=' + maxItem.version + '&exe=' + maxItem.exe + '&txt=' + maxItem.txt,
            title: tt('app_update.notify_VERSION', { VERSION: maxItem.version }),
            new_tab: true,
        }
    }
}

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
        const upd = await checkUpdates()
    } catch (err) {
        console.error('Cannot check updates', err)
        alert('Cannot check updates' + err)
    }

    const onchain = await getState(api, pathname, initialState.offchain)
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

