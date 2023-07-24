import { fromJS, Map, List } from 'immutable'
import { api } from 'golos-lib-js'

import { fork, call, put, takeLatest } from 'redux-saga/effects'
import { makeOid, SPONSORS_PER_PAGE } from 'app/utils/sponsors'

export function* sponsorWatches() {
    yield takeLatest('global/FETCH_SPONSORS', fetchSponsors)
    yield takeLatest('global/FETCH_SPONSOREDS', fetchSponsoreds)
}

export function* fetchSponsors({ payload: { author, from }}) {
    yield put({
        type: 'global/UPDATE',
        payload: {
            key: ['sponsors'],
            notSet: Map(),
            updater: m => m.set('loading', true)
        }
    })

    let sponsors = yield call([api, api.getPaidSubscribersAsync], {
        author,
        oid: makeOid(),
        from, limit: SPONSORS_PER_PAGE + 1
    })

    yield put({
        type: 'global/UPDATE',
        payload: {
            key: ['sponsors'],
            notSet: Map(),
            updater: m => {
                m = m.set('loading', false)
                m = m.set('data', fromJS(sponsors))
                return m
            }
        }
    })
}

export function* fetchSponsoreds({ payload: { sponsor, from }}) {
    yield put({
        type: 'global/UPDATE',
        payload: {
            key: ['sponsoreds'],
            notSet: Map(),
            updater: m => m.set('loading', true)
        }
    })

    let sponsoreds = yield call([api, api.getPaidSubscriptionsAsync], {
        subscriber: sponsor,
        select_oid: makeOid(),
        start_author: from,
        start_oid: from ? makeOid() : undefined,
        limit: SPONSORS_PER_PAGE + 1
    })

    yield put({
        type: 'global/UPDATE',
        payload: {
            key: ['sponsoreds'],
            notSet: Map(),
            updater: m => {
                m = m.set('loading', false)
                m = m.set('data', fromJS(sponsoreds))
                return m
            }
        }
    })
}
