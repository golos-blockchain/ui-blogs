import { api } from 'golos-lib-js'

export function* getBlockings(account, namesToCheck) {
    try {
        let lst = []
        const rels = yield api.getAccountRelations({
            my_account: account,
            with_accounts: namesToCheck
        })
        console.log('rels', rels)
        for (let [key, val] of Object.entries(rels)) {
            if (val.blocking) {
                lst.push(key)
            }
        }
        let res = { blocking: {} }
        res.blocking[account] = lst
        return res
    } catch (err) {
        console.error(err)
        throw err
    }
}
