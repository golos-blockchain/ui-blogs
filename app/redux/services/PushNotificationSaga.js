import {take, call, put, select, fork, cancel} from 'redux-saga/effects';
import {SagaCancellationException} from 'redux-saga';
import user from 'app/redux/User';
import NotifyContent from 'app/components/elements/Notifications/NotifyContent';
import { notificationSubscribe, notificationUnsubscribe, notificationTake } from 'app/utils/NotifyApiClient';

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
    return Object.keys(presets).filter(k => presets[k]);
}

function* onUserLogin(action) {
    let presets = getScopePresets(action.username).join(',');

    if (!presets) {
        console.log('GNS: all scopes disabled, so will not subscribe');
        return;
    }

    let removeTaskIds = null;
    while (true) {
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
                        if (!getScopePresets(action.username).includes(scope)) {
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
            yield put({
                type: 'ADD_NOTIFICATION',
                payload: NotifyContent(task)
            });
        }
    }
}

export default {
    onUserLogin
}
