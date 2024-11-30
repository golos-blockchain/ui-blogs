// modified https://github.com/jprichardson/react-qr/blob/master/index.js
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import qrImage from 'qr-image'

export default class ReactQR extends Component {
  static propTypes = {
    text: PropTypes.string.isRequired
  }

  render() {
    let opts = { type: 'png', margin: 1 }
    if (this.props.size) {
      opts.size = this.props.size
    }
    let pngBuffer = qrImage.imageSync(this.props.text, opts)
    let dataURI = 'data:image/png;base64,' + pngBuffer.toString('base64')
    return (
      <img className='react-qr' src={dataURI} />
    )
  }
}
