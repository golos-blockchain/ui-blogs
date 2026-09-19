import React from 'react'
import Icon from 'app/components/elements/Icon'
import tt from 'counterpart'
import ScrollToTop from 'react-scroll-up'

const ScrollButton = () => {
    return (
        <ScrollToTop showUnder={160}>
            <span className='ScrollButton' title={tt('g.back_to_top')}>
                <Icon name='arrow' className='arrow-up' size='3x' />
            </span>
        </ScrollToTop>
    )
}

export default ScrollButton
