import React from 'react'
import { Field, } from 'formik'
import { Asset, AssetEditor, } from 'golos-lib-js/lib/utils'

class AmountAssetField extends React.Component {
    static defaultProps = {
        amountField: 'amount',
    }

    onChange = (e) => {
        const { amountField, values, setFieldValue, assets } = this.props
        const value = e.target.value
        const asset = assets[value]
        if (asset) {
            const { supply } = asset
            const oldValue = values[amountField].asset
            setFieldValue(amountField, AssetEditor(oldValue.amount,
                supply.precision, supply.symbol))

            if (!values.author) { // if not edit mode
                if (asset.allow_override_transfer || value === 'GBG') {
                    if (values.tip_cost)
                        setFieldValue('tip_cost', false)
                    setFieldValue('disable_tip', true)
                } else {
                    setFieldValue('disable_tip', false)
                }
            }
        }
    }

    render() {
        const { name, assets, values, amountField } = this.props

        const options = []
        for (const [ sym, asset ] of Object.entries(assets)) {
            options.push(<option value={sym}>{sym}</option>)
        }

        const { asset } = values[amountField]

        return (<Field name={name} as='select' value={asset.symbol} onChange={this.onChange}
            style={{ minWidth: '5rem', height: 'inherit', backgroundColor: 'transparent', border: 'none' }}
            autoComplete='off' autoCorrect='off' spellCheck='false'>
                {options}
            </Field>)
    }
}

export default AmountAssetField
