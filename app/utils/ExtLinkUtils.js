export function msgsHost() {
    return $STM_Config && $STM_Config.messenger_service && $STM_Config.messenger_service.host
}

export function msgsLink(to = '') {
    try {
        const host = msgsHost()
        if (!host) {
            console.error('No messenger_service in config, but used in links!')
            return ''
        }
        if (to && !to.includes('@')) {
            to = '@' + to
        }
        let url = new URL(to || '', host)
        return url.toString()
    } catch (err) {
        console.error(err)
        return ''
    }
}
