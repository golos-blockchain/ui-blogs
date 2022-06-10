import semver from 'semver'
import tt from 'counterpart'

import fetchWithTimeout from 'shared/fetchWithTimeout'

export async function checkUpdates() {
    const url = new URL(
        '/blogs-' + ($STM_Config.platform === 'linux' ? 'linux' : 'win'),
        $STM_Config.app_updater.host
    ).toString()
    let res = await fetchWithTimeout(url, 3000)
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
            if (semver.gte($STM_Config.app_version, curVer)) {
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
        return {
            show: true,
            id: maxItem.version,
            link: '/__app_update?v=' + maxItem.version + '&exe=' + maxItem.exe + '&txt=' + maxItem.txt,
            title: tt('app_update.notify_VERSION', { VERSION: maxItem.version }),
            new_tab: true,
        }
    }
    return {}
}
