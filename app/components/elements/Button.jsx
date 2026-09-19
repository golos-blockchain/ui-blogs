import React from 'react'
import cn from 'classnames'

const Button = ({
    onClick,
    children,
    type = 'primary',
    round = false
}) => {
    const btnClasses = cn('golos-btn', {
        [`btn-${type}`]: true,
        'btn-round': round
    })
    return (
        <button className={btnClasses} onClick={onClick} role='button'>{children}</button>
    )
}

export default Button
