import React from 'react';
import { Link } from 'react-router';
//import shave from 'shave';
import truncate from 'lodash/truncate';

import './ConversationListItem.css';

export default class ConversationListItem extends React.Component {
    makeLink = () => {
        const { conversationLinkPattern } = this.props;
        if (conversationLinkPattern) {
            const {  contact } = this.props.data;
            return conversationLinkPattern.replace('*', contact);
        }
        return null;
    };

    onClick = (event) => {
        const { onConversationSelect } = this.props;
        if (onConversationSelect) {
            event.preventDefault();
            onConversationSelect(this.props.data, this.makeLink(), event);
        }
    };

    render() {
        const { selected } = this.props;
        const { avatar, contact, last_message, size } = this.props.data;

        const link = this.makeLink();

        const unreadMessages = size && size.unread_inbox_messages;

        return (
            <Link to={link} className={'conversation-list-item' + (selected ? ' selected' : '')}>
                <img className='conversation-photo' src={avatar} alt='conversation' />
                <div className='conversation-info'>
                    <h1 className='conversation-title'>{contact}</h1>
                    <div className='conversation-snippet'>{last_message && truncate(last_message.message, {length: 30})}
                    </div>
                    {unreadMessages ? <div className='conversation-unread'>{unreadMessages}</div> : null}
                </div>
            </Link>
        );
    }
}
