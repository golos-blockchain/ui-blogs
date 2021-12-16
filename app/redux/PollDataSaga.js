import { fork, call, put, select } from 'redux-saga/effects';
import { getNotifications } from 'app/utils/NotifyApiClient';

const wait = ms => (
    new Promise(resolve => {
        setTimeout(() => resolve(), ms)
    })
)

let webpush_params = null;

export default function* pollData() {
    while(true) {
        if (document.visibilityState !== 'hidden') {
            const username = yield select(state => state.user.getIn(['current', 'username']));
            if (username) {
                let counters = null;
                try {
                    counters = yield call(getNotifications, username, webpush_params);
                } catch (error) {
                    console.error('getNotifications', error);
                }
                if (counters)
                    yield put({type: 'UPDATE_NOTIFICOUNTERS', payload: counters});
            }
            yield call(wait, 5000);
        } else {
            yield call(wait, 500);
        }
    }
}
