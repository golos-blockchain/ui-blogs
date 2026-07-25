// modified https://github.com/jprichardson/react-qr/blob/master/index.js
import React from 'react'
import PropTypes from 'prop-types'
import qrImage from 'qr-image'

const ReactQR = (props) => {
    const { text, size, ...rest } = props

    let opts = { type: 'png', margin: 1 }
    if (size) {
        opts.size = size
    }
    let pngBuffer = qrImage.imageSync(text, opts)
    let dataURI = 'data:image/png;base64,' + pngBuffer.toString('base64')

    return (
        <img className='react-qr' src={dataURI} {...rest} />
    )
}

ReactQR.propTypes = {
    text: PropTypes.string.isRequired
}

export default ReactQR
