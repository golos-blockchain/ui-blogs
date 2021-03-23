import React from 'react';
import tt from 'counterpart';

import './Message.css';

export default class Message extends React.Component {
    onMessageSelect = (event) => {
        if (this.props.onMessageSelect) {
            const { data, selected } = this.props;
            this.props.onMessageSelect(data, !selected, event);
        }
    };

    doNotSelectMessage = (event) => {
        event.stopPropagation();
    };

    render() {
        const {
            data,
            isMine,
            startsSequence,
            endsSequence,
            showTimestamp,
            selected,
        } = this.props;

        const friendlyDate = data.date.toLocaleString();

        const loading = (!data.receive_date || data.receive_date.startsWith('19') || data.deleting) ? ' loading' : ''; 

        const unread = data.unread ? (<div className={'unread' + loading}>●</div>) : null;

        let content;
        if (data.type === 'image') {
            const src = $STM_Config.img_proxy_prefix + '0x0/' + data.message;
            const src_preview = $STM_Config.img_proxy_prefix + '600x300/' + data.message;
            content = (<a href={src} target='_blank' rel='noopener noreferrer' tabIndex='-1' onClick={this.doNotSelectMessage}>
                <img src={src_preview} alt={src} />
            </a>);
        } else {
            content = data.message.split('\n').map(line => {
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
        }

        const modified = (data.receive_date !== data.create_date) && !data.receive_date.startsWith('19');

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

                <div className={'bubble-container' + (selected ? ' selected' : '')}>
                    {isMine ? unread : null}
                    <div className={'bubble' + loading} onClick={this.onMessageSelect} title={friendlyDate + (modified ? tt('g.modified') : '')}>
                        { content }
                    </div>
                    {!isMine ? unread : null}
                </div>
            </div>
        );
    }
}
