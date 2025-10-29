import React from 'react'
import cn from 'classnames'
import tt from 'counterpart'
import CloseButton from 'react-foundation-components/lib/global/close-button';

class AppLogs extends React.Component {
    render() {
        const { logs, logLimit, showLogs, hideMe } = this.props;
        const lines = logs.split('\n');
        return <div className='AppLogs'>
            <div>
                <h4>{tt('app_settings.logs')}</h4>
                <CloseButton
                    onClick={() => {
                        hideMe();
                    }}
                />
            </div>
            {lines.map((line, i) => {
                let parts = line.split(' ');
                parts = parts.filter(part => part.length > 0);
                const level = parts[4];
                const err = level === 'E';
                const warning = level === 'W';
                return <div className={cn('line', {
                    err,
                    warning,
                })} key={i}>
                    {line}
                </div>
            })}
            {logLimit !== 1000 ? <button className='button hollow'
                onClick={e => {
                    showLogs(1000);
                }}>
                {tt('g.load_more')}
            </button>
            : <button className='button hollow'
                onClick={e => {
                    hideMe();
                }}>
                {tt('g.close')}
            </button>}
        </div>
    }
}

export default AppLogs;