import { fetchEx } from 'golos-lib-js/lib/utils'

const requestBase = () => ({
    method: 'post',
    credentials: 'include',
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
    }
})

const notifyAvailable = () => {
    return process.env.BROWSER && typeof($STM_Config) !== 'undefined'
        && $STM_Config.notify_service && $STM_Config.notify_service.host;
};

const notifyUrl = (pathname) => {
    return new URL(pathname, window.$STM_Config.notify_service.host).toString();
};

function setSession(request) {
    request.headers['X-Session'] = localStorage.getItem('X-Session');
}

export function notifySession() {
    return localStorage.getItem('X-Session')
}

function saveSession(response) {
    let session = null;
    for (const header of response.headers.entries()) { // Firefox Android not supports response.headers.get()
        if (header[0].toLowerCase() === 'x-session') {
            session = header[1];
            break;
        }
    }
    if (!session) return;
    localStorage.setItem('X-Session', session);
}

export function notifyApiLogin(account, authSession) {
    if (!notifyAvailable()) return;
    let request = Object.assign({}, requestBase(), {
        body: JSON.stringify({account, authSession}),
    });
    setSession(request);
    return fetchEx(notifyUrl(`/login_account`), request).then(r => {
        saveSession(r);
        return r.json();
    });
}

export function notifyApiLogout() {
    if (!notifyAvailable()) return;
    let request = Object.assign({}, requestBase(), {
        method: 'get',
    });
    setSession(request);
    fetchEx(notifyUrl(`/logout_account`), request).then(r => {
        saveSession(r);
    });
}

export function getNotifications(account) {
    if (!notifyAvailable()) return Promise.resolve(null);
    let request = Object.assign({}, requestBase(), {method: 'get'});
    setSession(request);
    return fetchEx(notifyUrl(`/counters/@${account}`), request).then(r => {
        saveSession(r);
        return r.json();
    }).then(res => {
        return res.counters;
    });
}

export function markNotificationRead(account, fields) {
    if (!notifyAvailable()) return Promise.resolve(null);
    let request = Object.assign({}, requestBase(), {method: 'put', mode: 'cors'});
    setSession(request);
    const fields_str = fields.join(',');
    return fetchEx(notifyUrl(`/counters/@${account}/${fields_str}`), request).then(r => {
        saveSession(r);
        return r.json();
    }).then(res => {
        return res.counters;
    });
}

export async function notificationSubscribe(account, scopes = 'message', sidKey = '__subscriber_id') {
    if (!notifyAvailable()) return;
    if (window[sidKey]) return;
    try {
        let request = Object.assign({}, requestBase(), {method: 'get'});
        setSession(request);
        let response = await fetchEx(notifyUrl(`/subscribe/@${account}/${scopes}`), request);
        const result = await response.json();
        if (response.ok) {
            saveSession(response);
        }
        if (result.subscriber_id) {
            window[sidKey] = result.subscriber_id;
            return result.subscriber_id;
        } else {
            throw new Error('Cannot subscribe, error: ' + result.error);
        }
    } catch (ex) {
        console.error(ex)
    }
    throw new Error('Cannot subscribe');
}

export async function notificationUnsubscribe(account, sidKey = '__subscriber_id') {
    if (!notifyAvailable()) return;
    if (!window[sidKey]) return;
    let url = notifyUrl(`/unsubscribe/@${account}/${window[sidKey]}`);
    let response;
    try {
        let request = Object.assign({}, requestBase(), {method: 'get'});
        setSession(request);
        response = await fetchEx(url, request);
        if (response.ok) {
            saveSession(response);
        }
        const result = await response.json();
        if (result.status !== 'ok') {
            throw new Error(response.status + ': ' + result.error);
        } else {
            window[sidKey] = null;
            return result.was;
        }
    } catch (ex) {
        console.error(ex);
        throw ex;
    }
}

export async function notificationTake(account, removeTaskIds, forEach, sidKey = '__subscriber_id') {
    if (!notifyAvailable()) return;
    let url = notifyUrl(`/take/@${account}/${window[sidKey]}`);
    if (removeTaskIds)
        url += '/' + removeTaskIds;
    let response;
    try {
        let request = Object.assign({}, requestBase(), {method: 'get'});
        setSession(request);
        response = await fetchEx(url, {
            ...request,
            timeout: null
        })
        if (response.ok) {
            saveSession(response);
        }
        const result = await response.json();
        if (result.status === 'ok' && Array.isArray(result.tasks)) {
            removeTaskIds = '';

            let removeTaskIdsArr = [];
            for (let task of result.tasks) {
                const [ type, op ] = task.data;

                forEach(type, op, task.timestamp, task.id, task.scope);

                removeTaskIdsArr.push(task.id.toString());
            }

            removeTaskIds = removeTaskIdsArr.join(',');

            return removeTaskIds;
        } else {
            throw new Error(response.status + ': ' + result.error);
        }
    } catch (ex) {
        console.error(ex);
        throw ex;
    }
}

function getSubId(author, permlink) {
    return author + '|' + permlink
}

export async function subscribePost(account, author, permlink) {
    const entity_id = getSubId(author, permlink)

    const request = Object.assign({}, requestBase(), {
        body: JSON.stringify({account, entity_id}),
    })
    try {
        setSession(request)
        const response = await fetchEx(notifyUrl(`/subs/subscribe`), request)
        const result = await response.json()
        if (result.status === 'ok') {
        } else {
            throw new Error(response.status + ': ' + result.error)
        }
    } catch (ex) {
        console.error(ex)
        throw ex
    }
}

export async function unsubscribePost(account, author, permlink) {
    const entity_id = getSubId(author, permlink)

    const request = Object.assign({}, requestBase(), {
        method: 'DELETE'
    })
    try {
        setSession(request)
        const response = await fetchEx(notifyUrl(`/subs/@${account}/${entity_id}/unsubscribe`), request)
        const result = await response.json()
        if (result.status === 'ok') {
            console.log('unsi', result)
        } else {
            throw new Error(response.status + ': ' + result.error)
        }
    } catch (ex) {
        console.error(ex)
        throw ex
    }
}

export async function markCommentsRead(account, author, permlink) {
    const entity_id = getSubId(author, permlink)

    const request = Object.assign({}, requestBase(), {
        method: 'PATCH'
    })
    try {
        setSession(request)
        const response = await fetchEx(notifyUrl(`/subs/@${account}/${entity_id}`), request)
        const result = await response.json()
        if (result.status === 'ok') {
            console.log('mark_read', result)
        } else {
            throw new Error(response.status + ': ' + result.error)
        }
    } catch (ex) {
        console.error(ex)
        throw ex
    }
}

export async function getSubs(account, from, limit) {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (limit) params.set('limit', limit)
    try {
        let request = Object.assign({}, requestBase(), {method: 'get'});
        setSession(request)
        const url = notifyUrl(`/subs/@${account}`) + '?' + params.toString()
        const response = await fetchEx(url, request)
        const result = await response.json()
        if (result.status === 'ok') {
            return result
        } else {
            throw new Error(response.status + ': ' + result.error)
        }
    } catch (ex) {
        console.error(ex)
        throw ex
    }
}

export async function getEvents(account, author, permlink) {
    const entity_id = getSubId(author, permlink)
    try {
        let request = Object.assign({}, requestBase(), {method: 'get'});
        setSession(request)
        const url = notifyUrl(`/subs/@${account}/${entity_id}/events`)
        const response = await fetchEx(url, {
            ...request,
            timeout: 1500
        })
        const result = await response.json()
        if (result.status === 'ok') {
            return result.result || []
        } else {
            throw new Error(response.status + ': ' + result.error)
        }
    } catch (ex) {
        console.error(ex)
        throw ex
    }
}

export function isHighlight() {
    if (!process.env.BROWSER) {
        return false
    }
    let pa
    try {
        pa = new URLSearchParams(window.location.search)
    } catch (err) {
        console.error(err)
        return false
    }
    return pa.has('highlight')
}

export function addHighlight(url) {
    if (!process.env.BROWSER) {
        return url
    }
    const [ main, hash ] = url.split('#')
    const [ body, search ] = main.split('?')
    if (!search) {
        return body + '?highlight=1' + (hash ? '#' + hash : '')
    } else {
        return body + '?' + search + '&highlight=1' + (hash ? '#' + hash : '')
    }
}

if (process.env.BROWSER) {
    window.getNotifications = getNotifications;
    window.markNotificationRead = markNotificationRead;
    window.notificationSubscribe = notificationSubscribe;
    window.notificationUnsubscribe = notificationUnsubscribe;
    window.notificationTake = notificationTake;
}
