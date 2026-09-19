import React, { useState } from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'

const LoadingIndicator = ({ type, inline, size }) => {
    const [progress, setProgress] = useState(0)

    const style = size
        ? {
              width: size,
              height: size,
          }
        : null

    switch (type) {
        case 'dots':
            return (
                <div className='LoadingIndicator three-bounce'>
                    <div className='bounce1' />
                    <div className='bounce2' />
                    <div className='bounce3' />
                </div>
            )
        case 'circle':
            return (
                <div
                    className={
                        'LoadingIndicator circle' +
                        (inline ? ' inline' : '')
                    }
                >
                    <div style={style} />
                </div>
            )
        case 'little':
            return (
                <div
                    className={
                        'LoadingIndicator circle little' +
                        (inline ? ' inline' : '')
                    }
                >
                    <div style={style} />
                </div>
            )
        default:
            return (
                <div
                    className={cn('LoadingIndicator loading-overlay', {
                        'with-progress': progress > 0,
                    })}
                >
                    <div className='loading-panel'>
                        <div className='spinner'>
                            <div className='bounce1' />
                            <div className='bounce2' />
                            <div className='bounce3' />
                        </div>
                        <div className='progress-indicator'>
                            <span>{progress}</span>
                        </div>
                    </div>
                </div>
            )
    }
}

LoadingIndicator.propTypes = {
    type: PropTypes.oneOf(['dots', 'circle', 'little']),
    inline: PropTypes.bool,
    size: PropTypes.string,
}

export default LoadingIndicator
