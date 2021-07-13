import { NTYPES, notificationsArrayToMap } from 'app/utils/Notifications';

const request_base = {
    method: 'post',
    credentials: 'include',
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
    }
};

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

export function notifyApiLogin(account, signatures) {
    if (!notifyAvailable() || window.$STM_ServerBusy) return;
    let request = Object.assign({}, request_base, {
        body: JSON.stringify({account, signatures}),
    });
    setSession(request);
    return fetch(notifyUrl(`/login_account`), request).then(r => {
        saveSession(r);
        return r.json();
    });
}

export function notifyApiLogout() {
    if (!notifyAvailable() || window.$STM_ServerBusy) return;
    let request = Object.assign({}, request_base, {
        method: 'get',
    });
    setSession(request);
    fetch(notifyUrl(`/logout_account`), request).then(r => {
        saveSession(r);
    });
}

export function getNotifications(account) {
    if (!notifyAvailable() || window.$STM_ServerBusy) return Promise.resolve(null);
    let request = Object.assign({}, request_base, {method: 'get'});
    setSession(request);
    return fetch(notifyUrl(`/counters/@${account}`), request).then(r => {
        saveSession(r);
        return r.json();
    }).then(res => {
        return notificationsArrayToMap(res.counters);
    });
}

export function markNotificationRead(account, fields) {
    if (!notifyAvailable() || window.$STM_ServerBusy) return Promise.resolve(null);
    let request = Object.assign({}, request_base, {method: 'put', mode: 'cors'});
    setSession(request);
    const field_nums_str = fields.map(f => NTYPES.indexOf(f)).join('-');
    return fetch(notifyUrl(`/counters/@${account}/${field_nums_str}`), request).then(r => {
        saveSession(r);
        return r.json();
    }).then(res => {
        return notificationsArrayToMap(res.counters);
    });
}

export async function notificationSubscribe(account, subscriber_id = '') {
    if (!notifyAvailable() || window.$STM_ServerBusy) return;
    if (window.__subscriber_id) return;
    try {
        let request = Object.assign({}, request_base, {method: 'get'});
        setSession(request);
        let response = await fetch(notifyUrl(`/subscribe/@${account}/${subscriber_id}`), request);
        if (response.ok) {
            saveSession(response);
            const result = await response.json();
            window.__subscriber_id = result.subscriber_id;
        }
    } catch (ex) {
        console.error(ex)
    }
    if (!window.__subscriber_id) {
        throw new Error('Cannot subscribe');
    }
}

export async function notificationTake(account, removeTaskIds, forEach) {
    if (!notifyAvailable() || window.$STM_ServerBusy) return;
    let url = notifyUrl(`/take/@${account}/${window.__subscriber_id}`);
    if (removeTaskIds)
        url += '/' + removeTaskIds;
    let response;
    try {
        let request = Object.assign({}, request_base, {method: 'get'});
        setSession(request);
        response = await fetch(url, request);
        if (response && response.ok) {
            saveSession(response);
            const result = await response.json();
            if (Array.isArray(result.tasks)) {
                removeTaskIds = '';

                let removeTaskIdsArr = [];
                for (let task of result.tasks) {
                    const task_id = task[0];
                    const { data, timestamp } = task[2];
                    const [ type, op ] = data;

                    forEach(type, op, timestamp, task_id);

                    removeTaskIdsArr.push(task_id.toString());
                }

                removeTaskIds = removeTaskIdsArr.join('-');

                return removeTaskIds;
            }
        }
    } catch (ex) {
        console.error(ex);
        throw ex;
    }
}

if (process.env.BROWSER) {
    window.getNotifications = getNotifications;
    window.markNotificationRead = markNotificationRead;
    window.notificationSubscribe = notificationSubscribe;
    window.notificationTake = notificationTake;
}
