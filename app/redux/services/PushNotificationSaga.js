import {take, call, put, select, fork, cancel, takeLatest} from 'redux-saga/effects';
import {SagaCancellationException} from 'redux-saga';
import user from 'app/redux/User';
import app from 'app/redux/AppReducer';
import NotifyContent from 'app/components/elements/Notifications/NotifyContent';
import { notificationSubscribe, notificationUnsubscribe, notificationTake
    firebaseRegisterWs, firebaseUnregisterWs,
} from 'app/utils/NotifyApiClient';
import session from 'app/utils/session'
import { addNotification } from 'app/utils/NotificationService';

const wait = ms => (
    new Promise(resolve => {
        setTimeout(() => resolve(), ms)
    })
)

function getScopePresets(username) {
    let presets = localStorage.getItem('notify.presets-' + username);
    if (!presets) {
        presets = {
            receive: true, donate: true, comment_reply: true, mention: true, message: true, fill_order: true,
        };
    } else {
        presets = JSON.parse(presets);
        if (presets.fill_order === undefined) {
            presets.fill_order = true;
        }
    }
    if (presets.donate) {
        presets.donate_msgs = true
    }

    let bgPresets = []
    if (process.env.MOBILE_APP) {
        const forApp = ['comment_reply', 'mention']
        for (const p of forApp) {
            if (presets[p]) bgPresets.push(p)
        }
        if (presets.in_background === undefined) {
            presets.in_background = true
        }
    }
    const inBackground = presets.in_background
    delete presets.in_background
    return { presets: Object.keys(presets).filter(k => presets[k]),
        bgPresets,
        inBackground }
}

async function fcmGetToken() {
    return new Promise((resolve, reject) => {
        cordova.exec((winParam) => {
            console.log('fcmGetToken:', winParam)
            resolve(winParam)
        }, (err) => {
            console.error('fcmGetToken err', err)
            reject(err)
        }, 'CorePlugin', 'fcmGetToken', [])
    })
}

function showError(err) {
    addNotification({
        type: 'error',
        key: 'err_' + Date.now(),
        message: err,
        dismissAfter: 3000,
    });
}

function* registerFCM(username, scopes) {
    let token
    try {
        token = yield fcmGetToken()
    } catch (err) {
        showError('Ошибка уведомлений Firebase: ' + (err?.message))
        return
    }
    let reg
    try {
        reg = yield firebaseRegisterWs(username, token, scopes)
        window._fcmToken = token
        window._fcmAcc = username
    } catch (err) {
        showError('Ошибка уведомлений: ' + (err?.message))
        return
    }
    console.log('GNS-Firebase - registered:', reg)
}

function* unregisterFCM(username) {
    if (window._fcmToken && window._fcmAcc === username) {
        let unreg
        try {
            unreg = yield firebaseUnregisterWs(username, window._fcmToken)
            window._fcmToken = null
            window._fcmAcc = null
        } catch (err) {
        }
        if (unreg) {
            console.log('Firebase logout:', unreg)
        }
    }
}

export function* onUserLogin(action) {
    let presets = getScopePresets(action.username).presets.join(',');

    if (!presets) {
        console.log('GNS: all scopes disabled, so will not subscribe');
        return;
    }

    let removeTaskIds = null;
    while (true) {
        const currentName = session.load().currentName
        if (process.env.MOBILE_APP && currentName && window._fcmAcc !== currentName) {
            yield registerFCM(currentName, presets)
        }
        if (currentName !== action.username) {
            console.log('PushNotificationSaga stopped due to logout of', action.username)
            return
        }
        let tasks = [];
        try {
            if (document.visibilityState === 'hidden') {
                try {
                    let wasSubscribed = yield notificationUnsubscribe(action.username, '__notify_id');
                    if (wasSubscribed)
                        console.log('GNS: unsubscribed account:', action.username);
                } catch (error) {
                    console.error('notificationUnsubscribe', error);
                }
                yield call(wait, 500);
            } else {
                let sid = null;
                try {
                    sid = yield notificationSubscribe(action.username,
                        presets,
                        '__notify_id')
                    if (sid)
                        console.log('GNS: subscribed with id:', sid, 'account:', action.username);
                } catch (error) {
                    console.error('GNS: cannot subscribe', error)
                    yield call(wait, 5000);
                    continue;
                }

                removeTaskIds = yield notificationTake(action.username, removeTaskIds,
                    (type, op, timestamp, id, scope) => {
                        if (op._offchain) return;
                        if (!getScopePresets(action.username).presets.includes(scope)) {
                            return;
                        }
                        if (scope === 'message') {
                            if (type !== 'private_message') return;
                            if (op.to !== action.username) return;
                            if (op.update) return;
                        }
                        tasks.push({scope, type, op});
                    }, '__notify_id');

                yield call(wait, 2000);
            }
        } catch (error) {
            console.error('notificationTake', error);
            yield call(wait, 20000);
            continue;
        }
        for (let task of tasks) {
            addNotification({
                message: (t) => NotifyContent(t, task),
                custom: true,
                dismissAfter: 10000,
            });
        }
    }
}

export default {
    onUserLogin,
    getScopePresets,
    unregisterFCM,
}
