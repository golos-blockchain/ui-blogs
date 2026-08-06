import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'

import HintIcon from 'app/components/elements/common/HintIcon/HintIcon'
import radioOn from './radio-on.svg'
import radioOff from './radio-off.svg'

const RadioButton = ({ title, hint, id, name, disabled, selectedValue, className, onChange }) => {
    const onClick = (e) => {
        e.preventDefault()
        if (onChange) {
            onChange(id, name)
        }
    }

    return (
        <div key={id} className={cn('RadioButton__item', { RadioButton_disabled: disabled }, className)}>
            <label
                className='RadioButton__label'
                onClick={
                    disabled
                        ? null
                        : onClick
                }
            >
                <input
                    type='radio'
                    name={name}
                    className='RadioButton__input'
                    disabled={disabled}
                    checked={id === selectedValue}
                />
                <i
                    className={cn(
                        'RadioButton__svg-wrapper',
                        {
                            'RadioButton__svg-wrapper_value':
                                id === selectedValue,
                        }
                    )}
                    dangerouslySetInnerHTML={{
                        __html:
                            id === selectedValue
                                ? radioOn
                                : radioOff,
                    }}
                />
                <span className='RadioButton__label-text'>
                    {title}
                </span>
            </label>
            {hint ? (
                <span className='RadioButton__hint'>
                    <HintIcon hint={hint} />
                </span>
            ) : null}
        </div>
    )
}

RadioButton.propTypes = {
    title: PropTypes.string,
    hint: PropTypes.string,
    id: PropTypes.string,
    name: PropTypes.string,
    disabled: PropTypes.bool,
    selectedValue: PropTypes.string,
    className: PropTypes.string,
    onChange: PropTypes.func,
}

export default RadioButton
