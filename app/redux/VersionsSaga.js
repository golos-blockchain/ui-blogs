import { fork, put, takeLatest } from 'redux-saga/effects'
import { api } from 'golos-lib-js'

import { listVersions, getVersion } from 'app/utils/SearchClient'
import { tryDecryptContents, } from 'app/utils/sponsors'
import g from 'app/redux/GlobalReducer'

export function* versionsWatches() {
    yield fork(watchFetchVersions)
    yield fork(watchShowVersion)
}

export function* watchFetchVersions() {
    yield takeLatest(g.actions.fetchVersions.type, fetchVersions);
}

export function* watchShowVersion() {
    yield takeLatest(g.actions.showVersion.type, showVersion);
}

function* setLoading(key, loading) {
    yield put(g.actions.update({
            key: ['content'],
            notSet: {},
            updater: m => {
                m[key] = m[key] || {}
                m[key].versions = m[key].versions || {}
                m[key].versions.loading = loading
                return m
            }
    }))
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

        yield put(g.actions.update({
                key: ['content'],
                notSet: {},
                updater: m => {
                    m[key] = m[key] || {}
                    m[key].versions = m[key].versions || {}
                    m[key].versions.loading = false
                    m[key].versions.items = items
                    return m
                }
        }))
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
                yield tryDecryptContents([post])
                body = post.body
                lastUpdate = post.last_update
            } catch (err) {
                console.error(err)
            }
        }

        if (!body && !lastUpdate) {
            return
        }

        yield put(g.actions.update({
                key: ['content'],
                notSet: {},
                updater: m => {
                    m[key] = m[key] || {}
                    m[key].body = body
                    m[key].last_update = lastUpdate
                    m[key].versions = m[key].versions || {}
                    m[key].versions.current = v
                    return m
                }
        }))
    } catch (err) {
        console.error('showVersion', err)
    }
}
