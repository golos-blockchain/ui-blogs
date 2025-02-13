import { fork, call, put, select, takeEvery } from 'redux-saga/effects';
import {fromJS, Set, Map, List} from 'immutable'
import {getAccount, getContent, getWorkerRequest} from 'app/redux/SagaShared'
import {findSigningKey} from 'app/redux/AuthSaga'
import g from 'app/redux/GlobalReducer'
import user from 'app/redux/User'
import tr from 'app/redux/Transaction'
import getSlug from 'speakingurl'
import {DEBT_TICKER} from 'app/client_config'
import {serverApiRecordEvent} from 'app/utils/ServerApiClient'
import {PrivateKey, PublicKey} from 'golos-lib-js/lib/auth/ecc'
import {api, broadcast, auth, memo} from 'golos-lib-js'
import constants from './constants';
import tt from 'counterpart';


export function* transactionWatches() {
    yield fork(watchForBroadcast);
    yield fork(watchForUpdateAuthorities);
    yield fork(watchForUpdateMeta);
}

export function* watchForBroadcast() {
    yield takeEvery('transaction/BROADCAST_OPERATION', broadcastOperation);
}
export function* watchForUpdateAuthorities() {
    yield takeEvery('transaction/UPDATE_AUTHORITIES', updateAuthorities);
}
export function* watchForUpdateMeta() {
    yield takeEvery('transaction/UPDATE_META', updateMeta);
}

const hook = {
    preBroadcast_comment,
    preBroadcast_transfer,
    preBroadcast_transfer_to_tip: preBroadcast_transfer,
    preBroadcast_donate,
    preBroadcast_vote,
    preBroadcast_account_witness_vote,
    preBroadcast_custom_json,
    preBroadcast_account_setup,
    error_vote,
    error_custom_json,
    // error_account_update,
    error_account_witness_vote,
    accepted_comment,
    accepted_delete_comment,
    accepted_vote,
    accepted_account_update,
    accepted_withdraw_vesting,
    accepted_donate,
    accepted_worker_request_vote,
    accepted_paid_subscription_transfer,
    accepted_nft_transfer,
}

function* encryptMemoIfNeed(memoStr, to) {
    memoStr = toStringUtf8(memoStr);
    memoStr = memoStr.trim();
    const memo_private = yield select(
        state => state.user.getIn(['current', 'private_keys', 'memo_private'])
    );
    if(!memo_private) throw new Error('Unable to encrypt memo, missing memo private key');
    const account = yield call(getAccount, to);
    if(!account) throw new Error(`Unknown to account ${to}`);
    const memo_key = account.get('memo_key');
    memoStr = '# ' + memoStr;
    memoStr = memo.encode(memo_private, memo_key, memoStr);
    return memoStr;
}
const toStringUtf8 = o => (o ? Buffer.isBuffer(o) ? o.toString('utf-8') : o.toString() : o)

function* preBroadcast_transfer({operation}) {
    let memoStr = operation.memo;
    if (memoStr && operation._memo_private) {
        operation.memo = yield encryptMemoIfNeed(memoStr, operation.to);
        delete operation._memo_private;
    }
    return operation
}

function* preBroadcast_donate({operation}) {
    let memoStr = operation.memo && operation.memo.comment;
    if (memoStr && operation._memo_private) {
        operation.memo.comment = yield encryptMemoIfNeed(memoStr, operation.to);
        delete operation._memo_private;
    }
    return operation
}

function* preBroadcast_vote({operation, username}) {
    if (!operation.voter) operation.voter = username
    const {voter, author, permlink, weight} = operation
    // give immediate feedback
    yield put(g.actions.set({key: `transaction_vote_active_${author}_${permlink}`, value: true}))
    yield put(g.actions.voted({username: voter, author, permlink, weight}))
    return operation
}
function* preBroadcast_account_witness_vote({operation, username}) {
    if (!operation.account) operation.account = username
    const {account, witness, approve} = operation
    yield put(g.actions.updateAccountWitnessVote({account, witness, approve}))
    return operation
}

function* preBroadcast_custom_json({operation}) {
    const json = JSON.parse(operation.json)
    if(operation.id === 'follow') {
        try {
            if(json[0] === 'follow') {
                const {follower, following, what: [action]} = json[1]
                yield put(g.actions.update({
                    key: ['follow', 'getFollowingAsync', follower],
                    notSet: Map(),
                    updater: m => {
                        //m = m.asMutable()
                        if(action == null) {
                            m = m.update('blog_result', Set(), r => r.delete(following))
                        } else if(action === 'blog') {
                            m = m.update('blog_result', Set(), r => r.add(following))
                        }
                        m = m.set('blog_count', m.get('blog_result', Set()).size)
                        return m//.asImmutable()
                    }
                }))
            }
        } catch(e) {
            console.error('TransactionSaga unrecognized follow custom_json format', operation.json);
        }
    }
    return operation
}

function* preBroadcast_account_setup({operation}) {
    for (let setting of operation.settings) {
        if (setting[0] === 0) { // block
            const block_setting = setting[1]

            if (block_setting.block) {
                const key = ['follow', 'getFollowingAsync',
                        operation.account, 'blog_result']
                yield put(g.actions.update({
                    key,
                    notSet: Map(),
                    updater: m => {
                        m = m.delete(block_setting.account)
                        return m
                    }
                }))
            }

            yield put({
                type: 'global/UPDATE',
                payload: {
                    key: ['block', 'blocking', operation.account],
                    notSet: Map(),
                    updater: m => {
                        m = m.update('result', Set(), res => {
                            if (block_setting.block) {
                                res = res.add(block_setting.account)
                            } else {
                                res = res.delete(block_setting.account)
                            }
                            return res
                        })
                        return m
                    }
                }
            })
        }
    }
    return operation
}

function* error_account_witness_vote({operation: {account, witness, approve}}) {
    yield put(g.actions.updateAccountWitnessVote({account, witness, approve: !approve}))
}

/** Keys, username, and password are not needed for the initial call.  This will check the login and may trigger an action to prompt for the password / key. */
function* broadcastOperation(
    {payload:
        {type, operation, trx, confirm, warning, keys, username, password, hideErrors, successCallback, errorCallback}}) {
    let op;
    if (trx) {
        if (!trx.length) {
            return;
        }
        op = trx[0];
    } else {
        op = operation;
    }
    const operationParam = {type, operation: op, trx, keys, username, password, successCallback, errorCallback}
    const conf = typeof confirm === 'function' ? confirm() : confirm
    if(conf) {
        yield put(tr.actions.confirmOperation({confirm, warning, operation: operationParam, errorCallback}))
        return
    }
    const operations = trx || [[type, operation]];
    const payload = {operations, keys, username, hideErrors, successCallback, errorCallback}
    try {
        if (!keys || keys.length === 0) {
            payload.keys = []
            // user may already be logged in, or just enterend a signing passowrd or wif
            const signingKey = yield call(findSigningKey, {opType: type, op, username, password})
            if (signingKey)
                payload.keys.push(signingKey)
            else {
                if (!password) {
                    const opInfo = broadcast._operations[type]
                    let authType = opInfo && opInfo.roles[0]
                    if (authType === 'posting') authType = ''
                    if (type === 'paid_subscription_transfer' && !op.from_tip) authType = 'active'
                    yield put(user.actions.showLogin({
                      operation: {type, operation: op, trx, username, successCallback, errorCallback, saveLogin: true},
                      loginDefault: { username, authType }
                    }))
                    return
                }
            }
        }
        yield call(broadcastPayload, {payload})
    } catch(error) {
        console.error('TransactionSaga', error)
        try {
            serverApiRecordEvent('node_error/tx', JSON.stringify(operations) + '        |||        ' + error.toString())
        } catch (err2) {
            console.error('Cannot record tx error event:', err2)
        }
        if(errorCallback) errorCallback(error.toString())
    }
}

function* broadcastPayload({payload: {operations, keys, username, hideErrors, successCallback, errorCallback}}) {
    for (const [type] of operations) // see also transaction/ERROR
        yield put(tr.actions.remove({key: ['TransactionError', type]}))

    {
        const newOps = []
        for (const [type, operation] of operations) {
            if (hook['preBroadcast_' + type]) {
                const op = yield call(hook['preBroadcast_' + type], {operation, username})
                if(Array.isArray(op))
                    for(const o of op)
                        newOps.push(o)
                else
                    newOps.push([type, op])
            } else {
                newOps.push([type, operation])
            }
        }
        operations = newOps
    }

    // status: broadcasting
    const broadcastedEvent = () => {
        for (const [type, operation] of operations) {
            if (hook['broadcasted_' + type]) {
                try {
                    hook['broadcasted_' + type]({operation})
                } catch (error) {
                    console.error(error)
                }
            }
        }
    }
    try {
        yield new Promise((resolve, reject) => {
            broadcast.send({ extensions: [], operations }, keys, (err) => {
                if(err) {
                    console.error(err)
                    reject(err)
                } else {
                    broadcastedEvent()
                    resolve()
                }
            })
        })
        // status: accepted
        for (const [type, operation] of operations) {
            if (hook['accepted_' + type]) {
                try {
                    yield call(hook['accepted_' + type], {operation})
                } catch (error) {
                    console.error(error)
                }
            }
            const config = operation.__config
            if (config && config.successMessage) {
                yield put({type: 'ADD_NOTIFICATION', payload: {
                    key: "trx_" + Date.now(),
                    message: config.successMessage,
                    dismissAfter: 5000
                }})
            }
        }
        if (successCallback) try { successCallback() } catch (error) { console.error(error) }
    } catch (error) {
        console.error('TransactionSaga\tbroadcast', error)
        // status: error

        try {
            serverApiRecordEvent('node_error/tx_broadcast', JSON.stringify(operations) + '        |||        ' + error.toString())
        } catch (err2) {
            console.error('Cannot record tx broadcast error event:', err2)
        }

        yield put(tr.actions.error({operations, error, hideErrors, errorCallback}))

        for (const [type, operation] of operations) {
            if (hook['error_' + type]) {
                try {
                    yield call(hook['error_' + type], {operation})
                } catch (error2) {
                    console.error(error2)
                }
            }
        }
    }
}

function* accepted_comment({operation}) {
    const {author, permlink} = operation
    // update again with new $$ amount from the steemd node
    yield call(getContent, {author, permlink})
    // receiveComment did the linking already (but that is commented out)
    yield put(g.actions.linkReply(operation))
    // mark the time (can only post 1 per min)
    // yield put(user.actions.acceptedComment())
}

function* accepted_delete_comment({operation}) {
    yield put(g.actions.deleteContent(operation))
}

function* accepted_vote({operation: {author, permlink, weight}}) {
    console.log('Vote accepted, weight', weight, 'on', author + '/' + permlink, 'weight');
    // update again with new $$ amount from the steemd node
    yield put(g.actions.remove({key: `transaction_vote_active_${author}_${permlink}`}))
    yield call(getContent, {author, permlink})
}

function* accepted_donate({operation}) {
    if (operation.memo.target.permlink === '') return;
    const author = operation.memo.target.author;
    const permlink = operation.memo.target.permlink;
    console.log('Donate accepted on ', author, '/', permlink);
    yield call(getContent, {author, permlink})
    yield put(g.actions.donated({username: operation.from, author, permlink, amount: operation.amount}))
}

function* accepted_worker_request_vote({operation}) {
    const { voter, author, permlink} = operation;
    console.log('Worker request vote accepted on ', author, '/', permlink, 'by', voter);
    yield call(getWorkerRequest, {author, permlink, voter})
}

function* accepted_paid_subscription_transfer({operation}) {
    const { from, to, __prolong } = operation
    if (!__prolong) return

    console.log('Paid subscription prolongation accepted:', from, to);

    const state = yield select(state => state.global)
    const interval = state.getIn(['pso', 'interval'])

    const updater = data => {
        const idx = data.findIndex(i => i.get('subscriber') === from)
        if (idx !== -1) {
            data = data.update(idx, psro => {
                psro = psro.set('active', true)
                const np = new Date()
                np.setSeconds(np.getSeconds() + interval)
                psro = psro.set('next_payment', np.toISOString())
                return psro
            })
        }
        return data
    }

    yield put(g.actions.update({
        key: ['sponsors', 'data'],
        notSet: List(),
        updater,
    }))

    yield put(g.actions.update({
        key: ['sponsoreds', 'data'],
        notSet: List(),
        updater,
    }))
}

function* accepted_nft_transfer({operation}) {
    yield put(g.actions.update({
        key: ['confetti_nft_active'],
        updater: data => {
            return true
        },
    }))
    yield new Promise(resolve => setTimeout(resolve, 250))
    yield put(g.actions.update({
        key: ['confetti_nft_active'],
        updater: data => {
            return false
        },
    }))
}

function* accepted_withdraw_vesting({operation}) {
    let [account] = yield call([api, api.getAccountsAsync], [operation.account])
    account = fromJS(account)
    yield put(g.actions.receiveAccount({account}))
}

function* accepted_account_update({operation}) {
    let [account] = yield call([api, api.getAccountsAsync], [operation.account])
    account = fromJS(account)
    yield put(g.actions.receiveAccount({account}))

    // bug, fork, etc.. the folowing would be mis-leading
    // const {account} = operation
    // const {owner, active, posting, memo_key, json_metadata} = operation
    // {
    //     const update = { accounts: { [account]: {memo_key, json_metadata} } }
    //     if (posting) update.accounts[account].posting = posting
    //     if (active) update.accounts[account].active = active
    //     if (owner) update.accounts[account].owner = owner
    //     yield put(g.actions.receiveState(update))
    // }
}

// TODO remove soon, this was replaced by the UserKeys edit running usernamePasswordLogin (on dialog close)
// function* error_account_update({operation}) {
//     const {account} = operation
//     const stateUser = yield select(state => state.user)
//     const username = stateUser.getIn(['current', 'username'])
//     if (username === account) {
//         const pending_private_key = stateUser.getIn(['current', 'pending_private_key'])
//         if (pending_private_key) {
//             // remove pending key
//             const update = { pending_private_key: undefined }
//             yield put(user.actions.setUser(update))
//         }
//     }
// }

import base58 from 'bs58'
import secureRandom from 'secure-random'

// function* preBroadcast_account_witness_vote({operation, username}) {
// }
function* preBroadcast_comment({operation, username}) {
    if (!operation.author) operation.author = username
    let permlink = operation.permlink
    const {author, __config: {originalBody, autoVote, comment_options}} = operation
    const {parent_author = '', parent_permlink = operation.category } = operation
    const {title} = operation
    let {body} = operation

    body = body.trim()

    // TODO Slightly smaller blockchain comments: if body === json_metadata.steem.link && Object.keys(steem).length > 1 remove steem.link ..This requires an adjust of get_state and the API refresh of the comment to put the steem.link back if Object.keys(steem).length >= 1

    let body2
    if (originalBody) {
        const patch = createPatch(originalBody, body)
        // Putting body into buffer will expand Unicode characters into their true length
        if (patch && patch.length < new Buffer(body, 'utf-8').length)
            body2 = patch
    }
    if (!body2) body2 = body
    if (!permlink) permlink = yield createPermlink(title, author, parent_author, parent_permlink)

    const md = operation.json_metadata
    const json_metadata = typeof md === 'string' ? md : JSON.stringify(md)
    const op = {
        ...operation,
        permlink: permlink.toLowerCase(),
        parent_author, parent_permlink, json_metadata,
        title: new Buffer((operation.title || '').trim(), 'utf-8'),
        body: new Buffer(body2, 'utf-8'),
    }

    const comment_op = [
        ['comment', op],
    ]

    // comment_options must come directly after comment
    if(comment_options) {
        const isPost = parent_author === '';
        const {
            // max_accepted_payout = ["1000000.000", DEBT_TICKER].join(" "),
            max_accepted_payout = [isPost ? "10000.000" : "1.000", DEBT_TICKER].join(" "),
            percent_steem_dollars = 0, // 10000 === 100%
            allow_votes = true,
            allow_curation_rewards = true,
            curator_rewards_percent = null,
            comment_decrypt_fee
        } = comment_options

        const extensions = [];

        // beneficiaries
        // extensions.push(
        //     [0, { beneficiaries: [{ account: 'golosio', weight: 1000 }] }]
        // )

        if (curator_rewards_percent) {
            extensions.push([ 2, { percent: curator_rewards_percent }])
        }

        if (comment_decrypt_fee) {
            extensions.push([ 3, { fee: comment_decrypt_fee.toString() }])
        }

        comment_op.push(
            ['comment_options', {
                author,
                permlink,
                max_accepted_payout,
                percent_steem_dollars,
                allow_votes,
                allow_curation_rewards,
                extensions,
            }]
        )
    }

    if(autoVote) {
        const vote = {voter: op.author, author: op.author, permlink: op.permlink, weight: 10000}
        comment_op.push(['vote', vote])
    }

    return comment_op
}

function* createPermlink(title, author, parent_author, parent_permlink) {
    let permlink
    if (title && title.trim() !== '') {
        let s = slug(title)
        if(s === '') {
            s = base58.encode(secureRandom.randomBuffer(4))
        }
        // ensure the permlink(slug) is unique
        const slugState = yield call([api, api.getContentAsync], author, s, constants.DEFAULT_VOTE_LIMIT)
        let prefix
        if (slugState.body !== '') {
            // make sure slug is unique
            prefix = base58.encode(secureRandom.randomBuffer(4)) + '-'
        } else {
            prefix = ''
        }
        permlink = prefix + s
    } else {
        // comments: re-parentauthor-parentpermlink-time
        const timeStr = new Date().toISOString().replace(/[^a-zA-Z0-9]+/g, '')
        parent_permlink = parent_permlink.replace(/(-\d{8}t\d{9}z)/g, '')
        permlink = `re-${parent_author}-${parent_permlink}-${timeStr}`
    }
    if(permlink.length > 255) {
        // STEEMIT_MAX_PERMLINK_LENGTH
        permlink = permlink.substring(permlink.length - 255, permlink.length)
    }
    // only letters numbers and dashes shall survive
    permlink = permlink.toLowerCase().replace(/[^a-z0-9-]+/g, '')
    return permlink
}

import diff_match_patch from 'diff-match-patch'
const dmp = new diff_match_patch()

function createPatch(text1, text2) {
    if (!text1 && text1 === '') return undefined
    const patches = dmp.patch_make(text1, text2)
    const patch = dmp.patch_toText(patches)
    return patch
}

function* error_custom_json({operation: {id, required_posting_auths}}) {
    if(id === 'follow') {
        const follower = required_posting_auths[0]
        yield put(g.actions.update({
            key: ['follow', 'getFollowingAsync', follower, 'loading'],
            updater: () => null
        }))
    }
}
function* error_vote({operation: {author, permlink}}) {
    yield put(g.actions.remove({key: `transaction_vote_active_${author}_${permlink}`}));
    yield call(getContent, {author, permlink}); // unvote
}

// function* error_comment({operation}) {
//     // Rollback an immediate UI update (the transaction had an error)
//     yield put(g.actions.deleteContent(operation))
//     const {author, permlink, parent_author, parent_permlink} = operation
//     yield call(getContent, {author, permlink})
//     if (parent_author !== '' && parent_permlink !== '') {
//         yield call(getContent, {parent_author, parent_permlink})
//     }
// }

function slug(text) {
    return getSlug(text.replace(/[<>]/g, ''), {truncate: 128})
    //const shorten = txt => {
    //    let t = ''
    //    let words = 0
    //    const txt2 = txt.replace(/ +/g, ' ') // only 1 space in a row
    //    for (let i = 0; i < txt2.length; i++) {
    //        const ch = txt2.charAt(i)
    //        if (ch === '.' && i !== 0) {
    //            if(i === txt2.length - 1)
    //                break
    //            // If it looks like the end of a sentence
    //            if(txt2.charAt(i + 1) === ' ')
    //                break
    //        }
    //        if (ch === ' ' || ch === '\n') {
    //            words++
    //            if (words === 15) break
    //            if (i > 100) break
    //        }
    //        t += ch
    //    }
    //    return t
    //}
    //return shorten(text)
    //    .replace(/\n/g, ' ')
    //    .replace(/[ \.]/g, '-')
    //    .replace(/[^a-zA-Z0-9-_]+/g, '') // only letters and numbers _ and -
    //    .replace(/--/g, '-')
    //    .toLowerCase()
}

const pwPubkey = (name, pw, role) => auth.wifToPublic(auth.toWif(name, pw.trim(), role))

/** auths must start with most powerful key: owner for example */
// const twofaAccount = 'steem'
function* updateAuthorities({payload: {accountName, signingKey, auths, twofa, onSuccess, onError}}) {
    // Be sure this account is up-to-date (other required fields are sent in the update)
    const [account] = yield call([api, api.getAccountsAsync], [accountName])
    if (!account) {
        onError('Account not found')
        return
    }
    // const signingPubkey = signingKey ? signingKey.toPublicKey() : null
    const ops2 = {}
    let oldPrivate
    const addAuth = (authType, oldAuth, newAuth) => {
        let oldAuthPubkey, oldPrivateAuth
        try {
            oldPrivateAuth = PrivateKey.fromWif(oldAuth)
            oldAuthPubkey = oldPrivateAuth.toPublic().toString()
        } catch(e) {
            try {
                oldAuthPubkey = PublicKey.fromStringOrThrow(oldAuth).toString()
            } catch(e2) {
                //
            }
        }
        if(!oldAuthPubkey) {
            if(!oldAuth) {
                onError('Missing old key, not sure what to replace')
                console.error('Missing old key, not sure what to replace')
                return false
            }
            oldPrivateAuth = PrivateKey.fromSeed(accountName + authType + oldAuth)
            oldAuthPubkey = oldPrivateAuth.toPublicKey().toString()
        }
        if(authType === 'owner' && !oldPrivate)
            oldPrivate = oldPrivateAuth
        else if(authType === 'active' && !oldPrivate)
            oldPrivate = oldPrivateAuth
        else if(authType === 'posting' && !oldPrivate)
            oldPrivate = oldPrivateAuth

        let newPrivate, newAuthPubkey
        try {
            newPrivate = PrivateKey.fromWif(newAuth)
            newAuthPubkey = newPrivate.toPublicKey().toString()
        } catch (e) {
            newPrivate = PrivateKey.fromSeed(accountName + authType + newAuth)
            newAuthPubkey = newPrivate.toPublicKey().toString()
        }
        // if (oldAuthPubkey === newAuthPubkey) {
        //     onError('This is the same key')
        //     return false
        // }
        let authority
        if (authType === 'memo') {
            account.memo_key = newAuthPubkey
        } else {
            authority = fromJS(account[authType]).toJS()
            authority.key_auths = []
            authority.key_auths.push([newAuthPubkey, authority.weight_threshold])
            // const key_auths = authority.key_auths
            // let found
            // for (let i = 0; i < key_auths.length; i++) {
            //     if (key_auths[i][0] === oldAuthPubkey) {
            //         key_auths[i][0] = newAuthPubkey
            //         found = true
            //         break
            //     }
            // }
            // if (!found) {
                // key_auths.push([newAuthPubkey, authority.weight_threshold])
            //     console.log(`Could not find an ${authType} key to update, adding instead`)
            // }

            // Add twofaAccount with full authority
            // if(twofa && authType === 'owner') {
            //     let account_auths = fromJS(authority.account_auths)
            //     if(!account_auths.find(v => v.get(0) === twofaAccount)) {
            //         account_auths = account_auths.push(fromJS([twofaAccount, authority.weight_threshold]))
            //     }
            //     authority.account_auths = account_auths.toJS()
            // }
        }
        ops2[authType] = authority ? authority : account[authType]
        return true
    }
    for(const auth of auths)
        if(!addAuth(auth.authType, auth.oldAuth, auth.newAuth))
            return

    let key = oldPrivate
    if(!key) {
        try {
            key = PrivateKey.fromWif(signingKey)
        } catch(e2) {
            // probably updating a memo .. see if we got an active or owner
            const auth = (authType) => {
                const priv = PrivateKey.fromSeed(accountName + authType + signingKey)
                const pubkey = priv.toPublicKey().toString()
                const authority = account[authType]
                const key_auths = authority.key_auths
                for (let i = 0; i < key_auths.length; i++) {
                    if (key_auths[i][0] === pubkey) {
                        return priv
                    }
                }
                return null
            }
            key = auth('active')
            if(!key) key = auth('owner')
        }
    }
    if (!key) {
        onError(`Incorrect Password`)
        throw new Error('Trying to update a memo without a signing key?')
    }
    const {memo_key, json_metadata} = account
    const payload = {
        type: 'account_update', operation: {
            account: account.name, ...ops2,
            memo_key, json_metadata,
        }, keys: [key],
        successCallback: onSuccess,
        errorCallback: onError,
    }
    // console.log('sign key.toPublicKey().toString()', key.toPublicKey().toString())
    // console.log('payload', payload)
    yield call(broadcastOperation, {payload})
}

/** auths must start with most powerful key: owner for example */
// const twofaAccount = 'steem'
function* updateMeta(params) {
    // console.log('params', params)
    const {meta, account_name, signingKey, onSuccess, onError} = params.payload.operation
    console.log('meta', meta)
    console.log('account_name', account_name)
    // Be sure this account is up-to-date (other required fields are sent in the update)
    const [account] = yield call([api, api.getAccountsAsync], [account_name])
    if (!account) {
        onError('Account not found')
        return
    }
    if (!signingKey) {
        onError(`Incorrect Password`)
        throw new Error('Have to pass owner key in order to change meta')
    }

    try {
        console.log('account.name', account.name);
        const operations = ['update_account_meta', {
            account_name: account.name,
            json_meta: JSON.stringify(meta),
        }];
        yield broadcast.sendAsync({extensions: [], operations}, [signingKey]);
      if(onSuccess) onSuccess();
      // console.log('sign key.toPublicKey().toString()', key.toPublicKey().toString())
      // console.log('payload', payload)
    } catch(e) {
      console.error('Update meta', e);
      if(onError) onError(e)
    }
}
