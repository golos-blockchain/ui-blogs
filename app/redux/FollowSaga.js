import { call, put, select } from 'redux-saga/effects';
import { api } from 'golos-lib-js';

import g from 'app/redux/GlobalReducer';

/**
    This loadFollows 'blog'
*/

//fetch for follow/following count
export function* fetchFollowCount(account) {
    const counts = yield call([api, api.getFollowCountAsync], account)
    yield put(g.actions.update({
        key: ['follow_count', account],
        notSet: {},
        updater: data => ({
            ...data,
            follower_count: counts.follower_count,
            following_count: counts.following_count,
        })
    }))
}

// Test limit with 2 (not 1, infinate looping)
export function* loadFollows(method, account, type, force = false) {
    if(yield select(state => state.global.follow &&
        state.global.follow[method] &&
        state.global.follow[method][account] &&
        state.global.follow[method][account][type + '_loading'])) {
        // console.log('Already loading', method, account, type)
        return
    }

    if(!force) {
        const hasResult = yield select(state => state.global.follow &&
            state.global.follow[method] &&
            state.global.follow[method][account] &&
            state.global.follow[method][account][type + '_result'])
        if(hasResult) {
            // console.log('Already loaded', method, account, type)
            return
        }
    }

    yield put(g.actions.update({
        key: ['follow', method, account],
        notSet: {},
        updater: m => {
            m[type + '_loading'] = true
            return m
        }
    }))

    yield loadFollowsLoop(method, account, type)
}

function* loadFollowsLoop(method, account, type, start = '', limit = 100) {
    if(method === "getFollowersAsync") limit = 1000;
    const res = yield api[method](account, start, type, limit);

    let cnt = 0
    let lastAccountName = null

    yield put(g.actions.update({
        key: ['follow_inprogress', method, account],
        notSet: {},
        updater: (m) => {
            res.forEach((value) => {
                cnt += 1;

                const whatList = value.what || []
                const accountNameKey = method === "getFollowingAsync" ? "following" : "follower";
                const accountName = lastAccountName = value[accountNameKey]
                whatList.forEach((what) => {
                    m[what] = m[what] || []
                    if (!m[what].includes(accountName)) {
                        m[what].push(accountName)
                    }
                })
            })
            return m
        }
    }))

    if(cnt === limit) {
        // This is paging each block of up to limit results
        yield call(loadFollowsLoop, method, account, type, lastAccountName)
    } else {
        // This condition happens only once at the very end of the list.
        // Every account has a different followers and following list for: blog, or some other in future
        yield put(g.actions.update({
            key: [],
            updater: (m) => {
                const result = (
                    m.follow_inprogress &&
                    m.follow_inprogress[method] &&
                    m.follow_inprogress[method][account] &&
                    m.follow_inprogress[method][account][type]
                ) || []

                if (
                    m.follow_inprogress &&
                    m.follow_inprogress[method] &&
                    m.follow_inprogress[method][account]
                ) {
                    delete m.follow_inprogress[method][account][type]
                }

                m.follow = m.follow || {}
                m.follow[method] = m.follow[method] || {}
                m.follow[method][account] = {
                    ...(m.follow[method][account] || {}),
                    // Count may be set separately without loading the full xxx_result set
                    [type + '_count']: result.length,
                    [type + '_result']: [...result].sort().reverse(),
                    [type + '_loading']: false,
                }
                return m
            }
        }))
    }
}
