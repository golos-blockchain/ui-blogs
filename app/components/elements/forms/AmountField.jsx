import React from 'react'
import { Field, } from 'formik'
import { AssetEditor } from 'golos-lib-js/lib/utils'

class AmountField extends React.Component {
    static defaultProps = {
        name: 'amount',
    }

    _renderInput = ({ field, form }) => {
        const { value, ...rest } = field
        const { values, setFieldValue } = form
        return <input type='text' value={value.amountStr}
            {...rest} onChange={(e) => this.onChange(e, values, setFieldValue)}
            />
    }

    onChange = (e, values, setFieldValue) => {
        const { name } = this.props
        const newAmount = values[name].withChange(e.target.value)
        if (newAmount.hasChange && newAmount.asset.amount >= 0) {
            setFieldValue(name, newAmount)
        }
    }

    render() {
        const { placeholder, name, } = this.props
        return (<Field name={name} type='text'
            placeholder={placeholder}
            autoComplete='off' autoCorrect='off' spellCheck='false'>
                {this._renderInput}
            </Field>)
    }
}

export default AmountField
