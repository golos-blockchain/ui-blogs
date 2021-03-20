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

        const isSending = (!data.receive_date || data.receive_date.startsWith('19')) ? ' sending' : ''; 

        const unread = data.unread ? (<div className={'unread' + isSending}>●</div>) : null;

        const paragraphs = data.message.split('\n').map(line => {
            let spans = [];
            const words = line.split(' ');
            for (let word of words) {
                // eslint-disable-next-line
                if (word.length > 4 && /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/.test(word)) {
                    let href = word;
                    if (!href.startsWith('http://') && !href.startsWith('https://')) {
                        href = 'http://' + href;
                    }
                    spans.push(<a href={href} target='_blank' rel='noopener noreferrer'>{word}</a>);
                    spans.push(' ');
                } else if (word.length <= 2 && /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/.test(word)) {
                    spans.push(<span style={{fontSize: '20px'}}>{word}</span>);
                    spans.push(' ');
                } else {
                    spans.push(word + ' ');
                }
            }
            return (<span>{spans}<br/></span>);
        });

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
                    <div className={'bubble' + isSending} title={friendlyDate}>
                        { paragraphs }
                    </div>
                    {!isMine ? unread : null}
                </div>
            </div>
        );
    }
}
