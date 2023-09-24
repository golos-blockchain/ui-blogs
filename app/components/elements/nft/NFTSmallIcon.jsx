import React, { Component, } from 'react'

class NFTSmallIcon extends Component {
    render() {
        const { image, onClick, ...rest } = this.props

        return <a className='NFTSmallIcon' 
            style={{ backgroundImage: `url(${image})` }} onClick={onClick} href={onClick ? '#' : image} target='_blank' rel='nofollow noreferrer' {...rest}></a>
    }
}

export default NFTSmallIcon
