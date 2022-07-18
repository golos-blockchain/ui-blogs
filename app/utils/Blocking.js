import { api } from 'golos-lib-js'
import { Asset } from 'golos-lib-js/lib/utils'
import tt from 'counterpart'

export async function checkBlocking(blocker, blocking, tipAmount = false) {
    const rels = await api.getAccountRelationsAsync({
        my_account: blocker,
        with_accounts: [blocking]
    })
    if (rels[blocking] && rels[blocking].blocking) {
        const cprops = await api.getChainPropertiesAsync()
        if (cprops) {
            let acc = await api.getAccountsAsync([blocking])
            acc = acc[0]
            const tipBalance = Asset(acc.tip_balance)
            let cost = Asset(cprops.unwanted_operation_cost)
            if (tipAmount && tipAmount.symbol === 'GOLOS') {
                cost = cost.plus(tipAmount)
            }

            if (cost.gt(tipBalance)) {
                return { error: tt('do_not_bother.blocking_error', {
                        AMOUNT: cost.toString()
                    })
                }
            }

            return {
                confirm: tt('do_not_bother.blocking_confirm', {
                        AMOUNT: cost.toString()
                    })
            }
        }
    }
    return {}
}
