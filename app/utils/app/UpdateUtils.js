import tt from 'counterpart'
import { fetchEx } from 'golos-lib-js/lib/utils'

function updaterHost() {
    return $STM_Config.app_updater.host
}

async function httpGet(url, timeout = fetchEx.COMMON_TIMEOUT, responseType = 'text') {
    if (process.env.MOBILE_APP) {
        return await new Promise((resolve, reject) => {
            try {
                cordova.plugin.http.sendRequest(url.toString(), {
                    responseType,
                    timeout: Math.ceil(timeout / 1000)
                }, (resp) => {
                    resolve(resp.data)
                }, (resp) => {
                    reject(resp.error)
                })
            } catch (err) {
                reject(err)
            }
        })
    } else {
        let res = await fetchEx(url, {
            timeout
        })
        if (responseType === 'arraybuffer') {
            res = await res.arrayBuffer()
        } else {
            res = await res.text()
        }
        return res
    }
}

export async function checkUpdates(timeout = 2000) {
    let url = ''
    try {
        let path
        const isDesktop = !process.env.MOBILE_APP
        if (isDesktop) {
            path = 'desktop/' + ($STM_Config.platform === 'linux' ? 'linux' : 'windows')
        } else {
            path = 'messenger/android'
        }
        url = new URL(
            '/api/' + path, updaterHost()
        )
        url.searchParams.append('latest', '1')
        url.searchParams.append('after', $STM_Config.app_version)
        let res = await httpGet(url, timeout)
        res = JSON.parse(res)
        if (res.status === 'ok' && res.data) {
            const versions = Object.entries(res.data)
            if (versions[0]) {
                const [ v, obj ] = versions[0]
                if (obj.exe) {
                    let link = '/__app_update?v=' + v + '&exe=' + obj.exe + '&txt=' + obj.txt
                    if (!isDesktop) {
                        link = new URL('/api/html/' + path + '/' + v, updaterHost())
                        link = link.toString()
                    }
                    return {
                        show: true,
                        id: v,
                        link,
                        title: process.env.MOBILE_APP ?
                            tt('app_update.notify_blogs_VERSION', { VERSION: v }) :
                            tt('app_update.notify_VERSION', { VERSION: v }),
                        new_tab: true,
                    }
                } else {
                    console.error(versions[0])
                }
            }
        } else {
            if (res.error) {
                if (process.env.MOBILE_APP) {
                    throw new Error(res.error)
                }
            }
            console.error(res)
        }
    } catch (err) {
        if (process.env.MOBILE_APP) {
            throw new Error((err || 'checkUpdates') + ' (' + url + ')',
                { cause : err })
        } else {
            console.error('checkUpdates', err)
        }
    }
    return {}
}

export async function getChangelog(txtLink) {
    try {
        const decoder = new TextDecoder('windows-1251')
        let res
        if (process.env.MOBILE_APP) {
            res = await httpGet(txtLink, 1000, 'arraybuffer')
            res = decoder.decode(res)
        } else {
            res = await fetch(txtLink)
            res = decoder.decode(await res.arrayBuffer())
        }
        return res
    } catch (err) {
        console.error('getChangelog', err)
        throw err
    }
}
