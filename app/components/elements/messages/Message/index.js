import React from 'react';

import './Message.css';

export default class Message extends React.Component {
    render() {
        const {
            data,
            isMine,
            startsSequence,
            endsSequence,
            showTimestamp
        } = this.props;

        const friendlyDate = data.date.toLocaleString();

        const unread = data.unread ? (<div className='unread'>●</div>) : null;

        return (
            <div className={[
                'message',
                `${isMine ? 'mine' : ''}`,
                `${startsSequence ? 'start' : ''}`,
                `${endsSequence ? 'end' : ''}`
            ].join(' ')}>
                {
                    showTimestamp &&
                        <div className='timestamp'>
                            { friendlyDate }
                        </div>
                }

                <div className='bubble-container'>
                    {isMine ? unread : null}
                    <div className='bubble' title={friendlyDate}>
                        { data.message }
                    </div>
                    {!isMine ? unread : null}
                </div>
            </div>
        );
    }
}
