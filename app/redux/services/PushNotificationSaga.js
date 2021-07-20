import {take, call, put, select, fork, cancel} from 'redux-saga/effects';
import {SagaCancellationException} from 'redux-saga';
import user from 'app/redux/User';
import NotifyContent from 'app/components/elements/Notifications/NotifyContent';
import { notificationSubscribe, notificationTake } from 'app/utils/NotifyApiClient';

function getScopePresets(username) {
    let presets = localStorage.getItem('notify.presets-' + username);
    if (!presets) {
        presets = {
            receive: true, donate: true, comment_reply: true, mention: true, message: true,
        };
    } else {
        presets = JSON.parse(presets);
    }
    return Object.keys(presets);
}

function* onUserLogin(action) {
    let presets = getScopePresets(action.username).join(',');

    if (!presets) {
        console.log('GNS: all scopes disabled, so will not subscribe');
        return;
    }

    let sid = null;
    try {
        sid = yield notificationSubscribe(action.username,
            presets,
            '__notify_id')
        console.log('GNS: subscribed with id:', sid, 'account:', action.username);
    } catch (error) {
        console.error('GNS: cannot subscribe', error)
        return;
    }

    let removeTaskIds = null;
    while (true) {
        let tasks = [];
        try {
            removeTaskIds = yield notificationTake(action.username, removeTaskIds,
                (type, op, timestamp, id, scope) => {
                    if (op._offchain) return;
                    if (window.location.pathname.startsWith('/msgs')) {
                        return;
                    }
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
        } catch (error) {
            console.error('notificationTake', error);
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
