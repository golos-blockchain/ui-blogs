
const walletAvailable = () => {
    return typeof($STM_Config) !== 'undefined'
        && $STM_Config.wallet_service && $STM_Config.wallet_service.host
}

export function walletUrl(pathname = '') {
    try {
        return new URL(pathname, $STM_Config.wallet_service.host).toString()
    } catch (err) {
        console.error('walletUrl', err)
        return ''
    }
}
