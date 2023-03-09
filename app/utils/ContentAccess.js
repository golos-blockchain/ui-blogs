import { isBlocked } from 'app/utils/blacklist'
import session from 'app/utils/session'

function hasLS() {
    return typeof(localStorage) !== 'undefined'
}

export const getFilterApps = () => {
    return ['freedom.blog']
}

export function loadNsfwSettings(username) {
    const pref = hasLS && localStorage.getItem('nsfwPref-' + username)
    if (!pref) {
        // Here is a default value. If not set in settings
        // possible are
        // 'hide'
        // 'warn'
        // 'show'
        return 'warn'
    }
    return pref
}

export function loadGrayHideSettings(username) {
    const pref = hasLS && localStorage.getItem('downvotedPref-' + username)
    if (!pref) {
        // Here is a default value. If not set in settings
        // possible are
        // 'gray_and_hide'
        // 'gray_only'
        // 'no_gray' (no-gray-and-no-hide)
        return 'gray_and_hide'
    }
    return pref
}

// For all content (posts, comments everywhere)
export function grayContent(net_rshares, author_rep) {
    const threshold =  -5000000000000
    const meetsThreshold = net_rshares.compare(threshold) < 0
    const threshold2 = -50000000000000
    const meetsThreshold2 = net_rshares.compare(threshold2) < 0

    // settings
    if (process.env.BROWSER && window.NO_GRAY) return false

    return author_rep < 0
        || (author_rep < 70 && meetsThreshold)
        || meetsThreshold2
}

// For all content (posts, comments everywhere)
export function hideContent(net_rshares, author_rep) {
    const threshold = -500000000000000
    const meetsThreshold = net_rshares.compare(threshold) < 0

    // settings
    if (process.env.BROWSER && window.NO_HIDE) return false

    return author_rep < -25 || meetsThreshold
}

// Hide from all post lists (Blog, Feed, and New/Popular/etc.)
// and comment lists (/comments, /recent-replies)
export function hideSummary({ author, url, app, currentCategory, isNsfw, isOnlyblog, isOnlyapp,
        username, nsfwPref }) {
    const isNotAuthorized = !username
    const isMyPost = username === author
    const isPublic = currentCategory !== 'blog' && currentCategory !== 'feed'

    if (isBlocked(author, $STM_Config.blocked_users)) {
        return true
    }

    if (isBlocked(url, $STM_Config.blocked_posts)
        && (isNotAuthorized || isPublic)) {
        return true
    }

    if (isNsfw && !isMyPost) {
        if (nsfwPref === 'hide') {
            return true
        }
    }

    if (isNotAuthorized && (isOnlyblog || (isOnlyapp && !process.env.IS_APP))) {
        return true
    }

    const fapps = getFilterApps()
    if (isNotAuthorized && fapps.includes(app)) {
        return true
    }

    return false
}

// When post opened
export function hidePost({ dis, isOnlyapp, isOnlyblog, username, following }) {
    if (username && username === dis.get('author')) {
        return false
    }
    if (isOnlyapp && !process.env.IS_APP) {
        return 'onlyapp'
    }
    if (isOnlyblog) {
        if (!following && (!hasLS() || session.load().currentName)) {
            return 'loading'
        } else if (!following || 
            (!following.includes(dis.get('author')) &&
                !following.includes(dis.get('root_author')))) {
            return 'onlyblog'
        }
    }
    const fapps = getFilterApps()
    if (!username && fapps.includes(dis.get('app'))) {
        if (!hasLS() || session.load().currentName) {
            return 'loading'
        }
        return 'onlyauth'
    }
    return false
}

export function hideComment({ dis, username }) {
    const fapps = getFilterApps()
    if (!username && fapps.includes(dis.get('app'))) {
        return 'onlyauth'
    }
    return false
}
