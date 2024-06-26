import { fetchEx } from 'golos-lib-js/lib/utils'

const request_base = {
    method: 'post',
    credentials: 'include',
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
    }
};

const authAvailable = () => {
    return process.env.BROWSER && typeof($STM_Config) !== 'undefined'
        && $STM_Config.auth_service && $STM_Config.auth_service.host;
};

export const authUrl = (pathname) => {
    try {
        return new URL(pathname, $STM_Config.auth_service.host).toString();
    } catch (err) {
        console.error(authUrl, err)
        return ''
    }
};

export const authRegisterUrl = () => {
    let pathname = '/register';
    if (authAvailable() && $STM_Config.auth_service.custom_client) {
        pathname = '/' + $STM_Config.auth_service.custom_client + pathname;
    }
    return authUrl(pathname);
};

function setSession(request) {
    request.headers['X-Auth-Session'] = localStorage.getItem('X-Auth-Session');
}

export function authSession() {
    return localStorage.getItem('X-Auth-Session')
}

function saveSession(response) {
    let session = null;
    for (const header of response.headers.entries()) { // Firefox Android not supports response.headers.get()
        if (header[0].toLowerCase() === 'x-auth-session') {
            session = header[1];
            break;
        }
    }
    if (!session) return;
    localStorage.setItem('X-Auth-Session', session);
}

export function authApiLogin(account, signatures) {
    if (!authAvailable()) return;
    let request = Object.assign({}, request_base, {
        body: JSON.stringify({account, signatures}),
    });
    setSession(request);
    return fetch(authUrl(`/api/login_account`), request).then(r => {
        saveSession(r);
        return r.json();
    });
}

export function authApiLogout() {
    if (!authAvailable()) return;
    let request = Object.assign({}, request_base, {
        method: 'get',
    });
    setSession(request);
    fetch(authUrl(`/api/logout_account`), request).then(r => {
        saveSession(r);
    });
}

export async function cryptostoreEncrypt() {
    if (!authAvailable()) return {}
    let request = Object.assign({}, request_base, {
        body: JSON.stringify({}),
    })
    setSession(request)
    let r = await fetchEx(authUrl(`/api/cryptostore/encrypt`), request)
    saveSession(r)
    const obj = await r.json()
    if (obj.status !== 'ok') {
        console.error('cryptostoreEncrypt', obj)
        throw new Error(obj.error)
    }
    return obj // .key, .generated
}


export async function cryptostoreDecrypt(entries, oid) {
    if (!authAvailable()) return {}
    let request = Object.assign({}, request_base, {
        body: JSON.stringify({ entries, oid }),
    })
    setSession(request)
    let r = await fetchEx(authUrl(`/api/cryptostore/decrypt`), request)
    saveSession(r)
    const obj = await r.json()
    if (obj.status !== 'ok') {
        console.error('cryptostoreDecrypt', obj)
        throw new Error(obj.error)
    }
    return obj
}
