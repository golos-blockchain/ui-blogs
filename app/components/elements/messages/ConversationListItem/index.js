import React from 'react';
import shave from 'shave';

import './ConversationListItem.css';

export default class ConversationListItem extends React.Component {
    componentDidMount() {
        //shave('.conversation-snippet', 20);
    }

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
        const { avatar, contact, last_message } = this.props.data;

        const link = this.makeLink();

        return (
            <a href={link} onClick={this.onClick} className={'conversation-list-item' + (selected ? ' selected' : '')}>
                <img className='conversation-photo' src={avatar} alt='conversation' />
                <div className='conversation-info'>
                    <h1 className='conversation-title'>{contact}</h1>
                    <p className='conversation-snippet'>{last_message && last_message.message.substring(0, 20)}</p>
                </div>
            </a>
        );
    }
}
