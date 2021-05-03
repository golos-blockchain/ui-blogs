import {NTYPES, notificationsArrayToMap} from 'app/utils/Notifications';

const request_base = {
    method: 'post',
    mode: 'no-cors',
    credentials: 'same-origin',
    headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
    }
};

export function serverApiLogin(account, signatures) {
    if (!process.env.BROWSER || window.$STM_ServerBusy) return;
    const request = Object.assign({}, request_base, {body: JSON.stringify({account, signatures, csrf: $STM_csrf})});
    return fetch('/api/v1/login_account', request).then(r => r.json());
}

export function serverApiLogout() {
    if (!process.env.BROWSER || window.$STM_ServerBusy) return;
    const request = Object.assign({}, request_base, {body: JSON.stringify({csrf: $STM_csrf})});
    fetch('/api/v1/logout_account', request);
}

let last_call;
export function serverApiRecordEvent(type, val) {
    if (!process.env.BROWSER || window.$STM_ServerBusy) return;
    if (last_call && (new Date() - last_call < 5000)) return;
    last_call = new Date();
    const value = val && val.stack ? `${val.toString()} | ${val.stack}` : val;
    const request = Object.assign({}, request_base, {body: JSON.stringify({csrf: $STM_csrf, type, value})});
    fetch('/api/v1/record_event', request);
}

export function getNotifications(account) {
    if (!process.env.BROWSER || window.$STM_ServerBusy) return Promise.resolve(null);
    const request = Object.assign({}, request_base, {method: 'get'});
    return fetch(`/api/v1/notifications/${account}`, request).then(r => r.json()).then(res => {
        return notificationsArrayToMap(res);
    });
}

export function markNotificationRead(account, fields) {
    if (!process.env.BROWSER || window.$STM_ServerBusy) return Promise.resolve(null);
    const request = Object.assign({}, request_base, {method: 'put', mode: 'cors'});
    const field_nums_str = fields.map(f => NTYPES.indexOf(f)).join('-');
    return fetch(`/api/v1/notifications/${account}/${field_nums_str}`, request).then(r => r.json()).then(res => {
        return notificationsArrayToMap(res);
    });
}

let last_page, last_views, last_page_promise;
export function recordPageView(page, ref, posts) {
    if (last_page_promise && page === last_page) return last_page_promise;
    if (window.ga) { // virtual pageview
        let guid = localStorage.getItem('guid');
        if (guid) {
            window.ga('set', 'userId', guid);
        }
        window.ga('set', 'page', page);
        window.ga('send', 'pageview');
    }
    if (!process.env.BROWSER || window.$STM_ServerBusy) return Promise.resolve(0);
    const request = Object.assign({}, request_base, {body: JSON.stringify({csrf: $STM_csrf, page, ref, posts})});
    last_page_promise = fetch(`/api/v1/page_view`, request).then(r => r.json()).then(res => {
        last_views = res.views;
        return last_views;
    });
    last_page = page;
    return last_page_promise;
}

export async function notificationSubscribe(account, subscriber_id = '') {
    if (!process.env.BROWSER || window.$STM_ServerBusy) return;
    if (window.__subscriber_id) return;
    try {
        const request = Object.assign({}, request_base, {method: 'get'});
        let response = await fetch(`/api/v1/notifications/subscribe/${account}/${subscriber_id}`, request);
        if (response.ok) {
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
    let url = `/api/v1/notifications/take/${account}/${window.__subscriber_id}`;
    if (removeTaskIds)
        url += '/' + removeTaskIds;
    let response;
    try {
        const request = Object.assign({}, request_base, {method: 'get'});
        response = await fetch(url, request);
        if (response && response.ok) {
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

