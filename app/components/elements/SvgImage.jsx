import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'

const images = new Map([
    ['facebook', require('app/assets/images/facebook.svg')],
    ['golos', require('app/assets/images/golos.svg')],
])

const SvgImage = ({ className, name, width, height }) => {
    return (
        <span
            className={cn('SvgImage', className)}
            style={{
                display: 'inline-block',
                width,
                height,
            }}
            dangerouslySetInnerHTML={{ __html: images.get(name) }}
        />
    )
}

SvgImage.propTypes = {
    name: PropTypes.oneOf([...images.keys()]),
    width: PropTypes.string.isRequired,
    height: PropTypes.string.isRequired,
    className: PropTypes.string,
}

export default SvgImage
