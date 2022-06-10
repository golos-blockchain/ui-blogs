import fetch from 'cross-fetch'

export default async function fetchWithTimeout(url, timeoutMsec, opts) {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), timeoutMsec)
    return await fetch(url, {
        signal: controller.signal,
        ...opts
    })
}
