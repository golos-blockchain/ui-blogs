import { fork, put, takeLatest } from 'redux-saga/effects'
import { Map } from 'immutable'
import { api } from 'golos-lib-js'

import { listVersions, getVersion } from 'app/utils/SearchClient'
import { fromJSGreedy } from 'app/utils/StateFunctions'

export function* versionsWatches() {
    yield fork(watchFetchVersions)
    yield fork(watchShowVersion)
}

export function* watchFetchVersions() {
    yield takeLatest('global/FETCH_VERSIONS', fetchVersions);
}

export function* watchShowVersion() {
    yield takeLatest('global/SHOW_VERSION', showVersion);
}

function* setLoading(key, loading) {
    yield put({
        type: 'global/UPDATE',
        payload: {
            key: ['content'],
            notSet: Map(),
            updater: m => m.setIn([key, 'versions', 'loading'], loading)
        }
    })
}

export function* fetchVersions(action) {
    const { author, permlink, lastUpdate, numChanges } = action.payload
    const key = `${author}/${permlink}`
    try {
        yield setLoading(key, true)

        const versions = yield listVersions(author, permlink)
        let lastV = 0
        let items = versions.results.map(item => {
            let { time, v } = item
            time = time.split('.')[0]
            lastV = v
            return {
                time,
                v
            }
        })
        items.push({
            time: lastUpdate,
            v: numChanges + 1,
            latest: true
        })

        yield put({
            type: 'global/UPDATE',
            payload: {
                key: ['content'],
                notSet: Map(),
                updater: m => {
                    m = m.setIn([key, 'versions', 'loading'], false)
                    m = m.setIn([key, 'versions', 'items'], fromJSGreedy(items))
                    return m
                }
            }
        })
    } catch (err) {
        console.error('fetchVersions', err)
    }
}

export function* showVersion(action) {
    try {
        const { author, permlink, v } = action.payload
        const key = `${author}/${permlink}`

        let body, lastUpdate
        const vers = yield getVersion(author, permlink, v)
        if (vers) {
            body = vers.body
            lastUpdate = vers.lastUpdate
        } else {
            try {
                const post = yield api.getContentAsync(author, permlink, 0)
                body = post.body
                lastUpdate = post.last_update
            } catch (err) {
                console.error(err)
            }
        }

        if (!body && !lastUpdate) {
            return
        }

        yield put({
            type: 'global/UPDATE',
            payload: {
                key: ['content'],
                notSet: Map(),
                updater: m => {
                    m = m.setIn([key, 'body'], body)
                    m = m.setIn([key, 'last_update'], lastUpdate)
                    m = m.setIn([key, 'versions', 'current'], v)
                    return m
                }
            }
        })
    } catch (err) {
        console.error('showVersion', err)
    }
}
