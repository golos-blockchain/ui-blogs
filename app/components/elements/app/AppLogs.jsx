import React from 'react'
import cn from 'classnames'
import tt from 'counterpart'
import CloseButton from 'react-foundation-components/lib/global/close-button'

const AppLogs = ({ logs, logLimit, showLogs, hideMe }) => {
    const lines = logs.split('\n')
    return (
        <div className='AppLogs'>
            <div>
                <h4>{tt('app_settings.logs')}</h4>
                <CloseButton
                    onClick={() => {
                        hideMe()
                    }}
                />
            </div>
            {lines.map((line, i) => {
                let parts = line.split(' ')
                parts = parts.filter(part => part.length > 0)
                const level = parts[4]
                const err = level === 'E'
                const warning = level === 'W'
                return (
                    <div className={cn('line', {
                        err,
                        warning,
                    })} key={i}>
                        {line}
                    </div>
                )
            })}
            {logLimit < 1000 ? (
                <button className='button hollow'
                    onClick={e => {
                        const many = !confirm(tt('app_settings.logs_large'))
                        showLogs(many ? 5000 : 1000)
                    }}>
                    {tt('g.load_more')}
                </button>
            ) : (
                <button className='button hollow'
                    onClick={e => {
                        hideMe()
                    }}>
                    {tt('g.close')}
                </button>
            )}
        </div>
    )
}

export default AppLogs
