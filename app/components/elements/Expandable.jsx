import React, { useState, useEffect } from 'react'

import Icon from 'app/components/elements/Icon'

const Expandable = ({ title, opened: initialOpened = false, children, ...rest }) => {
    const [opened, setOpened] = useState(false)

    useEffect(() => {
        setOpened(!!initialOpened)
    }, [initialOpened])

    const onToggleExpander = () => {
        setOpened(prev => !prev)
    }

    return (
        <div className={'Expandable' + (opened ? ' opened' : '')} {...rest}>
            <div className='Expander' onClick={onToggleExpander}>
                <Icon name={opened ? 'chevron-up-circle' : 'chevron-down-circle'} size='2x' />
                <h5 style={{ paddingLeft: '0.5rem' }}>{title}</h5>
            </div>
            <div className='Expandable__content'>
                {children}
            </div>
        </div>
    )
}

export default Expandable
