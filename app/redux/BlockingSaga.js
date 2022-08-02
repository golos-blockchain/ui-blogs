import {fromJS, Map, Set} from 'immutable'
import { put, call, } from 'redux-saga/effects'
import { api } from 'golos-lib-js'

function* putResults(account, arr) {
    yield put({
        type: 'global/UPDATE',
        payload: {
            key: ['block', 'blocking', account],
            notSet: Map(),
            updater: m => {
                m = m.set('loading', false)
                m = m.update('result', Set(), res => {
                    for (const acc of arr) {
                        res = res.add(acc)
                    }
                    return res
                })
                return m
            }
        }
    })
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
        yield put({
            type: 'global/UPDATE',
            payload: {
                key: ['block', 'blocking', account],
                notSet: Map(),
                updater: m => m.set('loading', true)
            }
        })

        yield call(listBlockingsLoop, account)
    } catch (err) {
        console.error(err)
        throw err
    }
}

export function* getBlockings(account, namesToCheck) {
    try {
        yield put({
            type: 'global/UPDATE',
            payload: {
                key: ['block', 'blocking', account],
                notSet: Map(),
                updater: m => m.set('loading', true)
            }
        })

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
