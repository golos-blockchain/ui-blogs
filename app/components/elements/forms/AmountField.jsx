import React from 'react'
import { Field, ErrorMessage } from 'formik'

const AmountField = (props) => {
    const { placeholder, name, onChange, ...rest } = props

    const handleChange = (e, values, form) => {
        const newAmount = values[name].withChange(e.target.value)
        if (newAmount.hasChange && newAmount.asset.amount >= 0) {
            const { applyFieldValue } = form
            applyFieldValue(name, newAmount)
            if (onChange) {
                onChange(newAmount.asset, form)
            }
        }
    }

    const renderInput = ({ field, form }) => {
        const { value } = field
        const { values } = form
        return (
            <input
                type='text'
                value={value.amountStr}
                placeholder={placeholder}
                autoComplete='off'
                autoCorrect='off'
                spellCheck='false'
                {...rest}
                onChange={(e) => handleChange(e, values, form)}
            />
        )
    }

    return (
        <Field name={name} type='text' placeholder={placeholder}>
            {renderInput}
        </Field>
    )
}

AmountField.defaultProps = {
    name: 'amount'
}

export default AmountField
