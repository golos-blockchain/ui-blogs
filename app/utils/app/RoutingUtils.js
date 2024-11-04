import { browserHistory, } from 'react-router'

export function reloadLocation(href) {
    if (href && href[0] === '#') {
        throw new Error('reloadLocation cannot reload with href starts with #')
    }
    const { MOBILE_APP } = process.env
    if (MOBILE_APP) {
        let { pathname, hash, host } = window.location
        if (href) {
            if (href.startsWith('http:') || href.startsWith('https:')) {
                const url = new URL(href)
                if (url.host !== host) {
                    window.open(href, '_blank')
                    // And just opening in same tab - not working, somewhy opens with app's hostname...
                    return
                }
                href = url.pathname + url.search + url.hash
            }
            if (href[0] !== '/') {
                href = '/' + href
            }
        } else {
            href = pathname || '/'
        }
        window.location.href = '/#' + href
        if (!pathname || pathname === '/') {
            window.location.reload()
        }
        return
    }
    window.location.href = href
}

export function hrefClick(e) {
    if (process.env.MOBILE_APP) {
        let node, href, target    
        do {
            node = node ? node.parentNode : e.target
            if (!node) break
            href = node.href
            target = node.target
        } while (!href)
        if (!href) return
        e.preventDefault()
        if (target === 'blank' || target === '_blank') {
            window.open(href, '_blank')
            return
        }
        reloadLocation(href)
    }
}

//... and this processes such reloads:

export function fixRouteIfApp() {
    const { MOBILE_APP } = process.env
    if (!MOBILE_APP) {
        return true
    }
    let hash = window.location.hash
    if (hash && hash[1] === '/') {
        hash = hash.slice(1)
        if (!hash) hash = '/'
        browserHistory.push(hash)
        return false
    }
    return true
}
