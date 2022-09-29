import React from 'react'
import PropTypes from 'prop-types'
import { Asset } from 'golos-lib-js/lib/utils'
import tt from 'counterpart'

import DropdownMenu from 'app/components/elements/DropdownMenu'

class TipAssetList extends React.Component {
    static propTypes = {
        value: PropTypes.string.isRequired,
        currentAccount: PropTypes.object.isRequired,
        uias: PropTypes.object,
        onChange: PropTypes.func.isRequired,
    }

    onSelected = (e) => {
        e.preventDefault()
        const { onChange } = this.props
        if (onChange) {
            const { dataset } = e.currentTarget.parentNode
            const val = dataset.link.split(',')
            const sym = val[0]
            const prec = parseInt(val[1])
            onChange(sym, prec)
        }
    }

    render() {
        const { currentAccount, currentBalance } = this.props
        const golosBalance = Asset(currentAccount.get('tip_balance'))
        
        let tipBalanceValue = currentBalance && currentBalance.toString(0)

        const myAssets = []
        myAssets.push({
            key: 'GOLOS', value: 'GOLOS', link: 'GOLOS,3',
            label: golosBalance.toString(0),
            onClick: this.onSelected
        })

        const uias = this.props.uias && this.props.uias.toJS()
        if (uias) {
            for (const [sym, obj] of Object.entries(uias)) {
                const balance = Asset(obj.tip_balance)
                if (!balance.amount) {
                    continue
                }
                const prec = balance.precision
                myAssets.push({
                    key: sym, value: sym, link: sym + ',' + prec,
                    label: balance.toString(0),
                    onClick: this.onSelected
                })
            }
        }

        if (myAssets.length > 1) {
            const { value } = this.props
            tipBalanceValue = (
                <DropdownMenu className='TipAssetMenu'
                    selected={value} el='span' items={myAssets} />)
        }

        const size = tipBalanceValue.length > 16 ?
            ' micro' : tipBalanceValue.length > 13 ?
            ' mini' : ''

        return (
            <div className={'TipBalance' + size}>
            <b>{tt('token_names.TIP_TOKEN')}:</b><br/>
            {tipBalanceValue}
            </div>
        )
    }
}

export default TipAssetList
