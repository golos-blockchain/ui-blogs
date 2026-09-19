import React from 'react'
import { Field } from 'formik'
import { AssetEditor } from 'golos-lib-js/lib/utils'

const AmountAssetField = (props) => {
    const {
        name,
        assets,
        values,
        amountField = 'amount',
        setFieldValue,
        onChange,
        ...rest
    } = props

    const handleChange = (e) => {
        const value = e.target.value
        const asset = assets[value]
        if (asset) {
            const { supply } = asset
            const oldValue = values[amountField].asset
            setFieldValue(amountField, AssetEditor(
                oldValue.amount,
                supply.precision,
                supply.symbol
            ))

            if (onChange) {
                onChange(asset, e)
            }
        }
    }

    const options = []
    for (const [sym, asset] of Object.entries(assets)) {
        options.push(<option key={sym} value={sym}>{sym}</option>)
    }

    const { asset } = values[amountField]

    return (
        <Field
            name={name}
            as='select'
            value={asset.symbol}
            onChange={handleChange}
            style={{
                minWidth: '5rem',
                height: 'inherit',
                backgroundColor: 'transparent',
                border: 'none'
            }}
            autoComplete='off'
            autoCorrect='off'
            spellCheck='false'
            {...rest}
        >
            {options}
        </Field>
    )
}

AmountAssetField.defaultProps = {
    amountField: 'amount'
}

export default AmountAssetField
