import React from 'react'
import cn from 'classnames'

const Button = ({ children, primary, small, className, ...passProps }) => {
    return (
        <button
            type='button'
            {...passProps}
            className={cn(
                'Button',
                {
                    Button_primary: primary,
                    Button_small: small,
                },
                className
            )}
        >
            {children}
        </button>
    )
}

export default Button
