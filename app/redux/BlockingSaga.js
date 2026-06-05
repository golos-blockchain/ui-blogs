import { put, call } from 'redux-saga/effects'
import { api } from 'golos-lib-js'

import g from 'app/redux/GlobalReducer'

function* putResults(account, arr) {
    yield put(g.actions.update({
        key: ['block', 'blocking', account],
        notSet: {},
        updater: m => {
            m.loading = false
            m.result = [...new Set([...(m.result || []), ...arr])]
            return m
        }
    }))
}

function* listBlockingsLoop(account, from = '', list = []) {
    const limit = 100
    const rels = yield api.listAccountRelationsAsync({
        my_accounts: [account],
        from,
        limit
    })

    const results = ((rels && rels[account]) || []).map(rel => {
        return rel.whom
    })

    const count = results.length
    const merged = [...list, ...results]
    if (count < limit) {
        yield putResults(account, merged)
    } else {
        const newFrom = results[results.length - 1]
        yield call(listBlockingsLoop, account, newFrom,
            merged)
    }
}

export function* listBlockings(account) {
    try {
        yield put(g.actions.update({
            key: ['block', 'blocking', account],
            notSet: {},
            updater: m => {
                m.loading = true
                return m
            }
        }))

        yield call(listBlockingsLoop, account)
    } catch (err) {
        console.error(err)
        throw err
    }
}

export function* getBlockings(account, namesToCheck) {
    try {
        yield put(g.actions.update({
            key: ['block', 'blocking', account],
            notSet: {},
            updater: m => {
                m.loading = true
                return m
            }
        }))

        let lst = []
        const rels = yield api.getAccountRelationsAsync({
            my_account: account,
            with_accounts: namesToCheck
        })
        for (let [acc, val] of Object.entries(rels)) {
            if (val.blocking) {
                lst.push(acc)
            }
        }

        yield putResults(account, lst)
    } catch (err) {
        console.error(err)
        throw err
    }
}
