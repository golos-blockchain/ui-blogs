import React from 'react';
import { Link } from 'react-router';
//import shave from 'shave';
import truncate from 'lodash/truncate';

import './ConversationListItem.css';

export default class ConversationListItem extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            avatarSrc: require('app/assets/images/user.png'),
        };
    }

    componentDidMount() {
        const { data } = this.props;
        if (data && data.avatar)
            this.setState({
                avatarSrc: data.avatar,
            });
    }

    componentWillReceiveProps(nextProps) {
        const { data } = nextProps;
        if (data && data.avatar && data.avatar !== this.props.data.avatar)
            this.setState({
                avatarSrc: data.avatar,
            });
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
        const { avatar, isSystemMessage, contact, last_message, size } = this.props.data;

        const link = this.makeLink();

        const unreadMessages = size && size.unread_inbox_messages;

        let unread = null;
        if (last_message && last_message.unread) {
            unread = (<div className='conversation-unread mine'>●</div>);
        } else if (unreadMessages) {
            unread = (<div className='conversation-unread'>{unreadMessages}</div>);
        }

        return (
            <Link to={isSystemMessage ? null : link} className={'conversation-list-item' + (selected ? ' selected' : '')}>
                <img className='conversation-photo' src={this.state.avatarSrc} alt={''} />
                <div className='conversation-info'>
                    <h1 className='conversation-title'>{contact}</h1>
                    <div className='conversation-snippet'>{last_message && truncate(last_message.message, {length: 30})}
                    </div>
                    {unread}
                </div>
            </Link>
        );
    }
}
