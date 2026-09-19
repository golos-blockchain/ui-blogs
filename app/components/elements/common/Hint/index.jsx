import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'

import Icon from 'app/components/elements/Icon'

const Hint = ({ className, info, error, warning, width, align: propAlign, children, innerRef }) => {
    const [align, setAlign] = useState('center')
    const [alignCalculation, setAlignCalculation] = useState(!propAlign)
    const rootRef = useRef(null)

    useEffect(() => {
        if (alignCalculation) {
            const box = rootRef.current.getBoundingClientRect()

            let newAlign = 'center'

            if (
                box.x + box.width / 2 - window.scrollX >
                window.innerWidth - 150
            ) {
                newAlign = 'right'
            } else if (box.x - box.width / 2 - window.scrollX < 150) {
                newAlign = 'left'
            }

            setAlignCalculation(false)
            setAlign(newAlign)
        }
    }, [alignCalculation])

    if (alignCalculation) {
        return <div ref={rootRef} />
    }

    const finalAlign = propAlign || align

    let icon = 'Hint__icon'

    if (warning) {
        icon += ' Hint__icon_warning'
    } else if (error) {
        icon += ' Hint__icon_error'
    } else if (info) {
        icon += ' Hint__icon_info'
    } else {
        icon = null
    }

    let contentStyle

    if (width) {
        contentStyle = { width, maxWidth: 'unset' }
    }

    return (
        <div
            className={cn(
                'Hint',
                {
                    [`Hint_${finalAlign}`]: finalAlign,
                },
                className
            )}
            ref={innerRef}
        >
            <div className='Hint__content' style={contentStyle}>
                {icon ? (
                    <Icon name='editor/info' size='1_5x' className={icon} />
                ) : null}
                <div className='Hint__inner'>{children}</div>
            </div>
        </div>
    )
}

Hint.propTypes = {
    className: PropTypes.string,
    info: PropTypes.bool,
    error: PropTypes.bool,
    warning: PropTypes.bool,
    width: PropTypes.number,
    align: PropTypes.oneOf(['left', 'center', 'right']),
}

export default Hint
