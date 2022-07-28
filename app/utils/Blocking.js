import { api } from 'golos-lib-js'
import { Asset } from 'golos-lib-js/lib/utils'
import tt from 'counterpart'

async function checkBalance(blocking, tipAmount, isBother = false) {
    const cprops = await api.getChainPropertiesAsync()
    const tipBalance = Asset(blocking.tip_balance)
    let cost = Asset(cprops.unwanted_operation_cost)
    if (tipAmount && tipAmount.symbol === 'GOLOS') {
        cost = cost.plus(tipAmount)
    }

    const key = isBother ? 'bother' : 'blocking'

    if (cost.gt(tipBalance)) {
        return { error: tt(`do_not_bother.${key}_error`, {
                AMOUNT: cost.toString()
            })
        }
    }

    return {
        confirm: tt(`do_not_bother.${key}_confirm`, {
                AMOUNT: cost.toString()
            })
    }
}

export async function checkBlocking(blockerName, blockingName, tipAmount = false) {
    const accs = await api.getAccountsAsync([blockerName, blockingName])
    if (!accs || accs.length !== 2) return {}
    const [ blocker, blocking ] = accs
    const rels = await api.getAccountRelationsAsync({
        my_account: blockerName,
        with_accounts: [blockingName]
    })
    if (rels[blockingName] && rels[blockingName].blocking) {
        return await checkBalance(blocking, tipAmount)
    } else if (blocker.do_not_bother && blocking.reputation < 27800000000000) {
        return await checkBalance(blocking, tipAmount, true)
    }
    return {}
}
