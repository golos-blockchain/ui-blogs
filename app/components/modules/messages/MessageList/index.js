import React from 'react';

import Compose from 'app/components/elements/messages/Compose';
import Toolbar from 'app/components/elements/messages/Toolbar';
import ToolbarButton from 'app/components/elements/messages/ToolbarButton';
import Message from 'app/components/elements/messages/Message';

import './MessageList.css';

/*{
    id: 10,
    author: 'orange',
    message: 'It looks like it wraps exactly as it is supposed to. Lets see what a reply looks like!',
    timestamp: new Date().getTime()
},*/
export default class MessageList extends React.Component {
    componentDidUpdate(prevProps) {
        const { to, messages } = this.props;
        const hasMsgs = messages && prevProps.messages;
        let scroll = hasMsgs && messages.length > prevProps.messages.length;
        if (!scroll && hasMsgs && messages.length) {
            const msg1 = prevProps.messages[0];
            const msg2 = messages[0];
            if (msg1.from !== msg2.from || msg1.to !== msg2.to) {
                scroll = true;
            }
        }
        if (scroll) {
            scroll = document.getElementsByClassName('msgs-scrollable')[1];
            if (scroll) scroll.scrollTo(0,scroll.scrollHeight);
        }
    }

    renderMessages = () => {
        const { messages, selectedMessages, onMessageSelect } = this.props;
        let i = 0;
        let messageCount = messages.length;
        let tempMessages = [];

        while (i < messageCount) {
            let previous = messages[i - 1];
            let current = messages[i];
            let next = messages[i + 1];
            let isMine = current.author === this.props.account.name;
            let prevBySameAuthor = false;
            let nextBySameAuthor = false;
            let startsSequence = true;
            let endsSequence = true;
            let showTimestamp = true;

            const hour = 60 * 60 * 1000;

            if (!current.message) {
                i += 1;
                continue;
            }

            if (previous) {
                let previousDuration = current.date - previous.date;
                prevBySameAuthor = previous.author === current.author;
                
                if (prevBySameAuthor && previousDuration < hour) {
                    startsSequence = false;
                }

                if (previousDuration < hour) {
                    showTimestamp = false;
                }
            }

            if (next) {
                let nextDuration = next.date - current.date;
                nextBySameAuthor = next.author === current.author;

                if (nextBySameAuthor && nextDuration < hour) {
                    endsSequence = false;
                }
            }

            tempMessages.push(
                <Message
                    key={i}
                    idx={i}
                    isMine={isMine}
                    startsSequence={startsSequence}
                    endsSequence={endsSequence}
                    showTimestamp={showTimestamp}
                    data={current}
                    selected={selectedMessages && !!selectedMessages[current.nonce]}
                    onMessageSelect={onMessageSelect}
                />
            );

            // Proceed to the next message.
            i += 1;
        }

        return tempMessages;
    };

    render() {
        const { account, to, topCenter, topRight, onSendMessage, selectedMessages,
            onButtonImageClicked, onImagePasted,
            onPanelDeleteClick, onPanelEditClick, onPanelCloseClick } = this.props;
        return (
            <div className='message-list'>
                <Toolbar
                    title={topCenter}
                    rightItems={topRight}
                />

                <div className='message-list-container'>{this.renderMessages()}</div>
                {to ? (<Compose
                        account={account}
                        onSendMessage={onSendMessage}
                        rightItems={[
                            (<ToolbarButton key='image' icon='image-outline' onClick={onButtonImageClicked} />),
                            (<div key='emoji'>
                                <ToolbarButton className='msgs-emoji-picker-opener' icon='happy-outline' />
                                <div className='msgs-emoji-picker-tooltip' role='tooltip'></div>
                            </div>),
                        ]}
                        selectedMessages={selectedMessages}
                        onPanelDeleteClick={onPanelDeleteClick}
                        onPanelEditClick={onPanelEditClick}
                        onPanelCloseClick={onPanelCloseClick}
                        onImagePasted={onImagePasted}
                    />) : null}
            </div>
        );
    }
}
