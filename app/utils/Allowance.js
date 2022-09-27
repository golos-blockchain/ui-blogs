import { api } from 'golos-lib-js'
import { Asset } from 'golos-lib-js/lib/utils'
import tt from 'counterpart'

async function returnError(blocking, cost, type = 'blocking', fatal = false) {
    if (fatal) {
        return { error: tt(`do_not_bother.${type}_fatal_error`, {
                AMOUNT: cost.toString()
            })
        }
    }

    const tipBalance = Asset(blocking.tip_balance)

    if (cost.gt(tipBalance)) {
        return { error: tt(`do_not_bother.${type}_error`, {
                AMOUNT: cost.toString()
            })
        }
    }

    return {
        confirm: tt(`do_not_bother.${type}_confirm`, {
                AMOUNT: cost.toString()
            }),
        confirmType: type
    }
}

export const AllowTypes = {
    transfer: 1, // also donate
    comment: 2,
    commentEdit: 3,
    post: 4,
    postEdit: 5,
    vote: 6,
    voteArchived: 7,
}

function getServiceCost(actor, aType) {
    let res
    if (aType === AllowTypes.comment) { // but not edit
        res = actor.services.comment
    } else if (aType === AllowTypes.post) { // but not edit
        res = actor.services.post
    } else if (aType === AllowTypes.vote) { // but not voteArchived
        res = actor.services.vote
    }
    return res ? Asset(res) : Asset(0, 3, 'GOLOS')
}

const arrange = (obj) => Array.isArray(obj) ? obj : [obj]

export async function checkAllowed(blockingName, blockerNames, tipAmount = null, aTypes = AllowTypes.transfer) {
    aTypes = arrange(aTypes)
    blockerNames = [...new Set(blockerNames)]
    const accs = await api.getAccountsAsync([blockingName, ...blockerNames])
    if (!accs || accs.length !== 1+blockerNames.length) return {}

    const [ blocking, ...blockers ] = accs
    const rels = blockerNames.length ? await api.getAccountRelationsAsync({
        my_account: blockingName,
        with_accounts: blockerNames,
        direction: 'they_to_me'
    }) : {}

    let _props
    const props = async () => {
        _props = _props || await api.getChainPropertiesAsync()
        return _props
    }
    const unw = async () => Asset((await props()).unwanted_operation_cost)
    const unlim = async () => Asset((await props()).unlimit_operation_cost)

    let cost = Asset(0, 3, 'GOLOS')

    let hasNegRep = false
    let blockType
    let fatal = false
    for (const aType of aTypes) {
        const setFatal = () => {
            if (aType === AllowTypes.transfer) {
                fatal = true
            }
        }

        const negRep = aType == AllowTypes.comment ||
            aType == AllowTypes.post || aType == AllowTypes.vote ||
            aType == AllowTypes.voteArchived
        if (negRep && blocking.reputation < 0) {
            cost = cost.plus(await unlim())
            hasNegRep = true
        }
        const chainCost = getServiceCost(blocking, aType)
        if (chainCost.amount) {
            cost = cost.plus(chainCost)
        }

        if (aType === AllowTypes.vote || aType === AllowTypes.voteArchived)
            continue

        for (let i = 0; i < blockerNames.length; ++i) {
            const blockerName = blockerNames[i]
            const blocker = blockers[i]
            if (rels[blockerName] && rels[blockerName].blocking) {
                cost = cost.plus(await unw())
                blockType = 'blocking'
                setFatal()
            } else if (blocker.do_not_bother && blocking.reputation < 27800000000000) {
                cost = cost.plus(await unw())
                blockType = 'bother'
                setFatal()
            }
        }
    }

    const addAmount = () => {
        if (tipAmount) {
            cost = cost.plus(tipAmount)
        }
    }

    if (blockType) {
        addAmount()
        return await returnError(blocking, cost, blockType, fatal)
    }

    if (hasNegRep) {
        addAmount()
        return await returnError(blocking, cost, 'negrep', fatal)
    }

    if (cost.amount) {
        addAmount()
        return await returnError(blocking, cost, 'window', fatal)
    }

    return {}
}

export function contentPrefs(removers = [], hiders = []) {
    const blockers = []
    for (const remover of arrange(removers)) {
        if (!remover) continue
        blockers.push([remover, { remove: true }])
    }
    for (const hider of arrange(hiders)) {
        if (!hider) continue
        blockers.push([hider, { }])
    }
    if (!blockers.length) {
        return undefined
    }
    return {
        blockers
    }
}
