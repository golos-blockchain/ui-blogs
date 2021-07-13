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
        //yield call(wait, 20000);
        yield call(wait, 10000);

        const username = yield select(state => state.user.getIn(['current', 'username']));
        if (username) {
            const nc = yield call(getNotifications, username, webpush_params);
            yield put({type: 'UPDATE_NOTIFICOUNTERS', payload: nc});
        }
    }
}
