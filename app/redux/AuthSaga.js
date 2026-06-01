import { fork, call, put, select, takeEvery } from 'redux-saga/effects';
import user from 'app/redux/User'
import {getAccount} from 'app/redux/SagaShared'
import {PrivateKey} from 'golos-lib-js/lib/auth/ecc';
import { broadcast, api } from 'golos-lib-js';

export function* authWatches() {
    yield fork(watchForAuth) 
}

function* watchForAuth() {
    yield takeEvery(user.actions.accountAuthLookup.type, accountAuthLookup);
}

export function* accountAuthLookup({payload: {account, private_keys, login_owner_pubkey}}) {
    // console.log('accountAuthLookup', account.name)
    const stateUser = yield select(state => state.user)
    let keys
    if (private_keys)
        keys = private_keys
    else
        keys = stateUser.current && stateUser.current.private_keys

    if (!keys || !keys.posting_private) return
    const toPub = k => k ? k.toPublicKey().toString() : '-'
    const posting = keys.posting_private
    const active = keys.active_private
    const memo = keys.memo_private
    const auth = {
        posting: posting ? yield authorityLookup(
            {pubkeys: new Set([toPub(posting)]), authority: account.posting, authType: 'posting'}) : 'none',
        active: active ? yield authorityLookup(
            {pubkeys: new Set([toPub(active)]), authority: account.active, authType: 'active'}) : 'none',
        owner: 'none',
        memo: account.memo_key === toPub(memo) ? 'full' : 'none'
    }
    const accountName = account.name
    const pub_keys_used = {posting: toPub(posting), active: toPub(active), owner: login_owner_pubkey};
    yield put(user.actions.setAuthority({accountName, auth, pub_keys_used}))
}

/**
    @arg {object} data
    @arg {object} data.authority blockchain authority
    @arg {object} data.pubkeys Set public key strings
    @return {string} full, partial, none
*/
function* authorityLookup({pubkeys, authority, authType}) {
    return yield call(authStr, {pubkeys, authority, authType})
}

function* authStr({pubkeys, authority, authType, recurse = 1}) {
    const t = yield call(threshold, {pubkeys, authority, authType, recurse})
    const r = authority.weight_threshold
    return t >= r ? 'full' : t > 0 ? 'partial' : 'none'
}

export function* threshold({pubkeys, authority, authType, recurse = 1}) {
    if (!pubkeys.size) return 0
    let t = pubkeyThreshold({pubkeys, authority})
    const account_auths = authority.account_auths || []
    const aaNames = account_auths.map(v => v[0])
    if (aaNames.length) {
        const aaAccounts = yield api.getAccountsAsync(aaNames)
        const aaThreshes = account_auths.map(v => v[1])
        for (let i = 0; i < aaAccounts.length; i++) {
            const aaAccount = aaAccounts[i]
            t += pubkeyThreshold({authority: aaAccount[authType], pubkeys})
            if (recurse <= 2) {
                const auth = yield call(authStr,
                    {authority: aaAccount[authType], pubkeys, recurse: ++recurse})
                if (auth === 'full') {
                    const aaThresh = aaThreshes[i]
                    t += aaThresh
                }
            }
        }
    }
    return t
}

function pubkeyThreshold({pubkeys, authority}) {
    let available = 0
    const key_auths = authority.key_auths || []
    key_auths.forEach(k => {
        if (pubkeys.has(k[0])) {
            available += k[1]
        }
    })
    return available
}

export function* findSigningKey({opType, op, username, password}) {
    let authTypes
    const opInfo = broadcast._operations[opType]
    if (opInfo && opInfo.roles[0] === 'posting' &&
        (opType !== 'paid_subscription_transfer' || op.from_tip)) {
        authTypes = 'posting, active'
    } else {
        authTypes = 'active, owner'
    }
    authTypes = authTypes.split(', ')

    const currentUser = yield select(state => state.user.current)
    const currentUsername = currentUser && currentUser.username

    username = username || currentUsername

    if (!username) return null

    if (username.indexOf('/') > -1) {
        // "alice/active" will login only with Alices active key
        username = username.split('/')[0]
    }

    const private_keys = currentUsername === username ? currentUser.private_keys : {}

    const account = yield call(getAccount, username);
    if (!account) throw new Error('Account not found')

    if (account.frozen) {
        throw new Error('Account is frozen: ' + username)
    }

    for (const authType of authTypes) {
        let private_key
        if (password) {
            try {
                private_key = PrivateKey.fromWif(password)
            } catch (e) {
                private_key = PrivateKey.fromSeed(username + authType + password)
            }
        } else {
            if(private_keys)
                private_key = private_keys[authType + '_private']
        }
        if (private_key) {
            const pubkey = private_key.toPublicKey().toString()
            const pubkeys = new Set([pubkey])
            const authority = account[authType]
            const auth = yield call(authorityLookup, {pubkeys, authority, authType})
            if (auth === 'full') return private_key
        }
    }
    return null
}

// function isPostingOnlyKey(pubkey, account) {
//     // TODO Support account auths
//     // yield put(g.actions.authLookup({account, pubkeys: pubkey})
//     // authorityLookup({pubkeys, authority: Map(account.posting), authType: 'posting'})
//     for (const p of account.posting.key_auths) {
//         if (pubkey === p[0]) {
//             if (account.active.account_auths.length || account.owner.account_auths.length) {
//                 console.log('UserSaga, skipping save password, account_auths are not yet supported.')
//                 return false
//             }
//             for (const a of account.active.key_auths)
//                 if (pubkey === a[0]) return false
//             for (const a of account.owner.key_auths)
//                 if (pubkey === a[0]) return false
//             return true
//         }
//     }
//     return false
// }
