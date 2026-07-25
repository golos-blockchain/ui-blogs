import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'

import RadioButton from 'app/components/elements/common/RadioButton'

const RadioGroup = ({ title, options, name, value, className, disabled, onChange }) => {
    return (
        <div title={title} className={cn('RadioGroup', {}, className)}>
            {options.map(item => (
                <RadioButton 
                    key={item.id}
                    id={item.id} 
                    title={item.title} 
                    hint={item.hint}
                    name={name} 
                    disabled={disabled} 
                    selectedValue={value}
                    onChange={onChange} 
                />
            ))}
        </div>
    )
}

RadioGroup.propTypes = {
    options: PropTypes.array.isRequired,
    disabled: PropTypes.bool,
    className: PropTypes.string,
    name: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    onChange: PropTypes.func.isRequired,
}

export default RadioGroup
