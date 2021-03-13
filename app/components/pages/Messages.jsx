import React from 'react';
import golos from 'golos-classic-js';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { browserHistory } from 'react-router';
import tt from 'counterpart';
import Icon from 'app/components/elements/Icon';
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper';
import Messenger from 'app/components/modules/messages/Messenger';
import { getProfileImage } from 'app/utils/NormalizeProfile';

class Messages extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        if (!this.props.contacts) return (<div></div>);
        return (<Messenger
            account={this.props.account}
			contacts={this.props.contacts}
            conversationTopLeft={[
                <a href='/'>
                    <h4>GOLOS</h4>
                </a>
            ]}
            conversationLinkPattern='/msgs/@*'
            messages={this.props.messages} />);
    }
}

function normalizeContacts(contacts, accounts, currentUser) {
    let contactsCopy = contacts ? [...contacts.toJS()] : [];
    for (let contact of contactsCopy) {
        let account = accounts && accounts.toJS()[contact.contact];
        contact.avatar = getProfileImage(account);

        if (contact.last_message.receive_date.startsWith('1970')) {
            contact.last_message.message = "";
            continue;
        }

        if (!currentUser || !accounts) continue;

        const currentAcc = accounts.toJS()[currentUser.get('username')];
        if (!currentAcc) continue;

        let public_key;
        if (currentAcc.memo_key === contact.last_message.to_memo_key) {
            public_key = contact.last_message.from_memo_key;
        } else {
            public_key = contact.last_message.to_memo_key;
        }

        try {
            const private_key = currentUser.getIn(['private_keys', 'memo_private']);
            console.log(private_key)
            console.log(public_key)
            let message = golos.messages.decode(private_key, public_key, contact.last_message);

            contact.last_message.message = JSON.parse(message).body;
        } catch (ex) {
            console.log(ex);
        }
    }
    return contactsCopy
}

function normalizeMessages(messages, accounts, currentUser) {
    let messagesCopy = messages ? [...messages.toJS()] : [];
    let id = 0;
    for (let msg of messagesCopy) {
        msg.id = ++id;
        msg.author = msg.from;
        msg.date = new Date(msg.receive_date + 'Z');

        if (!currentUser || !accounts) continue;

        const currentAcc = accounts.toJS()[currentUser.get('username')];
        if (!currentAcc) continue;

        let public_key;
        if (currentAcc.memo_key === msg.to_memo_key) {
            public_key = msg.from_memo_key;
        } else {
            public_key = msg.to_memo_key;
        }

        try {
            const private_key = currentUser.getIn(['private_keys', 'memo_private']);
            let message = golos.messages.decode(private_key, public_key, msg);
            msg.message = JSON.parse(message).body;
        } catch (ex) {
            console.log(ex);
        }
    }
    return messagesCopy.reverse()
}

module.exports = {
    path: '/msgs(/:to)',
    component: connect(
        state => {
            const currentUser = state.user.get('current');
            const accounts = state.global.get('accounts');
            const contacts = state.global.get('contacts');
            const messages = state.global.get('messages');

            return {
                contacts: normalizeContacts(contacts, accounts, currentUser),
                messages: normalizeMessages(messages, accounts, currentUser),
                account: currentUser && accounts.toJS()[currentUser.get('username')]
            };
        },
        {
        }
    )(Messages),
};
