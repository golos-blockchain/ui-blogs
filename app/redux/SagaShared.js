import { fork, call, put, select, takeEvery } from 'redux-saga/effects'
import { api } from 'golos-lib-js'

import constants from './constants'
import g from 'app/redux/GlobalReducer'
import app from 'app/redux/AppReducer'
import tr from 'app/redux/Transaction'
import { isHighlight, getEvents } from 'app/utils/NotifyApiClient'
import { tryDecryptContents, } from 'app/utils/sponsors'

export function* sharedWatches() {
    yield fork(watchTransactionErrors)
}   

export function* getAccount(username, force = false) {
    let account = yield select(state => state.global.accounts && state.global.accounts[username])
    if (force || !account) {
        [account] = yield call([api, api.getAccountsAsync], [username])
        if(account) {
            yield put(g.actions.receiveAccount({account}))
        }
    }
    return account
}

export function* watchTransactionErrors() {
    yield takeEvery(tr.actions.error.type, showTransactionErrorNotification);
}

function* showTransactionErrorNotification() {
    const errors = yield select(state => state.transaction.errors);

    if (errors) {
        for (const [key, message] of Object.entries(errors)) {
            if (message !== 'Duplicate transaction check failed')
                yield put(app.actions.addNotification({ key, message }));
            yield put(tr.actions.deleteError({ key }));
        }
    }
}

export function* getContent({author, permlink, resolve, reject}) {
    const content = yield call([api, api.getContentAsync], author, permlink, constants.DEFAULT_VOTE_LIMIT);
    yield tryDecryptContents([content])
    yield put(g.actions.receiveContent({content}))
    if (resolve && content) {
        resolve(content);
    } else if (reject && !content) {
        reject();
    }
}

export function* getWorkerRequest({author, permlink, voter}) {
    const query = {
        limit: 1,
        start_author: author,
        start_permlink: permlink
    };
    const [ wr ] = yield call([api, api.getWorkerRequestsAsync], query, 'by_created', true);
    if (wr) {
        const votes = yield call([api, api.getWorkerRequestVotesAsync], author, permlink, '', 50);
        wr.votes = votes;

        if (voter) {
            const [ myVote ] = yield call([api, api.getWorkerRequestVotesAsync], author, permlink, voter, 1);
            wr.myVote = (myVote && myVote.voter == voter) ? myVote : null
        }
        yield put(g.actions.receiveWorkerRequest({wr}))
    }
}

export function* applyEventHighlight(contentMap, author, permlink, curUser) {
    if (isHighlight() && curUser) {
        let events = []
        try {
            events = yield getEvents(curUser, author, permlink)
        } catch (err) {}
        const now = Date.now()
        for (const event of events) {
            try {
                const ed = JSON.parse(event.data)
                const link = `${ed.author}/${ed.permlink}`
                contentMap[link].sub_event = event
            } catch (err) {
                console.error('Cannot apply Sub API event', event.data, err)
            }
        }
        contentMap[author + '/' + permlink].highlighted = true
    }
}
