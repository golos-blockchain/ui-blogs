import tt from 'counterpart'

import { fetchEx } from 'golos-lib-js/lib/utils'

export async function checkUpdates() {
    const url = new URL(
        '/api/desktop/' + ($STM_Config.platform === 'linux' ? 'linux' : 'windows'),
        $STM_Config.app_updater.host
    )
    url.searchParams.append('latest', '1')
    url.searchParams.append('after', $STM_Config.app_version)
    let res = await fetchEx(url, { timeout: 3000 })
    res = await res.json()
    if (res.status === 'ok' && res.data) {
        const versions = Object.entries(res.data)
        if (versions[0]) {
            const [ v, obj ] = versions[0]
            if (obj.exe) {
                return {
                    show: true,
                    id: v,
                    link: '/__app_update?v=' + v + '&exe=' + obj.exe + '&txt=' + obj.txt,
                    title: tt('app_update.notify_VERSION', { VERSION: v }),
                    new_tab: true,
                }
            } else {
                console.error(versions[0])
            }
        }
    } else {
        console.error(res)
    }
    return {}
}
