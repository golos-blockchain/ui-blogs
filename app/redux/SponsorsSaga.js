import { api } from 'golos-lib-js'

import { call, put, takeLatest } from 'redux-saga/effects'
import { makeOid, SPONSORS_PER_PAGE } from 'app/utils/sponsors'
import g from 'app/redux/GlobalReducer'

export function* sponsorWatches() {
    yield takeLatest(g.actions.fetchSponsors.type, fetchSponsors)
    yield takeLatest(g.actions.fetchSponsoreds.type, fetchSponsoreds)
}

export function* fetchSponsors({ payload: { author, from }}) {
    yield put(g.actions.update({
            key: ['sponsors'],
            notSet: {},
            updater: m => {
                m.loading = true
                return m
            }
    }))

    let sponsors = yield call([api, api.getPaidSubscribersAsync], {
        author,
        oid: makeOid(),
        from, limit: SPONSORS_PER_PAGE + 1
    })

    yield put(g.actions.update({
            key: ['sponsors'],
            notSet: {},
            updater: m => {
                m.loading = false
                m.data = sponsors
                return m
            }
    }))
}

export function* fetchSponsoreds({ payload: { sponsor, from }}) {
    yield put(g.actions.update({
            key: ['sponsoreds'],
            notSet: {},
            updater: m => {
                m.loading = true
                return m
            }
    }))

    let sponsoreds = yield call([api, api.getPaidSubscriptionsAsync], {
        subscriber: sponsor,
        select_oid: makeOid(),
        start_author: from,
        start_oid: from ? makeOid() : undefined,
        limit: SPONSORS_PER_PAGE + 1
    })

    yield put(g.actions.update({
            key: ['sponsoreds'],
            notSet: {},
            updater: m => {
                m.loading = false
                m.data = sponsoreds
                return m
            }
    }))
}
