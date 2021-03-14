import React from 'react';
import golos from 'golos-classic-js';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { browserHistory } from 'react-router';
import max from 'lodash/max';
import tt from 'counterpart';
import Icon from 'app/components/elements/Icon';
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper';
import Messenger from 'app/components/modules/messages/Messenger';
import transaction from 'app/redux/Transaction';
import user from 'app/redux/User';
import { getProfileImage } from 'app/utils/NormalizeProfile';

function normalizeContacts(contacts, accounts, currentUser) {
    let contactsCopy = contacts ? [...contacts.toJS()] : [];
    for (let contact of contactsCopy) {
        let account = accounts && accounts[contact.contact];
        contact.avatar = getProfileImage(account);

        if (contact.last_message.receive_date.startsWith('1970')) {
            contact.last_message.message = "";
            continue;
        }

        if (!currentUser || !accounts) continue;

        const currentAcc = accounts[currentUser.get('username')];
        if (!currentAcc) continue;

        let public_key;
        if (currentAcc.memo_key === contact.last_message.to_memo_key) {
            public_key = contact.last_message.from_memo_key;
        } else {
            public_key = contact.last_message.to_memo_key;
        }

        try {
            const private_key = currentUser.getIn(['private_keys', 'memo_private']);
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

        const currentAcc = accounts[currentUser.get('username')];
        if (!currentAcc) continue;

        let public_key;
        if (currentAcc.memo_key === msg.to_memo_key) {
            public_key = msg.from_memo_key;
        } else {
            public_key = msg.to_memo_key;
            if (msg.read_date.startsWith('19')) {
                msg.unread = true;
            }
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

class Messages extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            contacts: [],
            messages: [],
            searchContacts: null,
        };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.messages.size !== this.props.messages.size
            || nextProps.contacts.size !== this.props.contacts.size
            || nextProps.memo_private !== this.props.memo_private) {
            const { contacts, messages, accounts, currentUser } = nextProps;
            if (!this.props.checkMemo(currentUser)) {
                return;
            }
            this.setState({
                contacts: normalizeContacts(contacts, accounts, currentUser),
                messages: normalizeMessages(messages, accounts, currentUser),
            });
            setTimeout(() => {
                const scroll = document.getElementsByClassName('scrollable')[1];
                if (scroll) scroll.scrollTo(0,scroll.scrollHeight);
            }, 1);
        }
    }

    onConversationSearch = async (event) => {
        const query = event.target.value;
        if (!query) {
            this.setState({
                searchContacts: null
            });
            return;
        }
        const accountNames = await golos.api.lookupAccounts(query, 6);

        const accountsArr = await golos.api.getAccounts([...accountNames]);

        let contacts = [];
        for (let account of accountsArr) {
            if (account.memo_key === 'GLS1111111111111111111111111111111114T1Anm'
                || account.name === this.props.account.name) {
                continue;
            }
            account.contact = account.name;
            account.avatar = getProfileImage(account);
            contacts.push(account);
        }
        if (contacts.length === 0) {
            contacts = [{contact: 'Ничего не найдено'}];
        }
        this.setState({
            searchContacts: contacts
        });
    };

    onSendMessage = (message, event) => {
        const { to, account, accounts, currentUser, messages } = this.props;
        const private_key = currentUser.getIn(['private_keys', 'memo_private']);
        
        this.props.sendMessage(account, private_key, accounts[to], message);
    };

    _renderMessagesTopCenter = () => {
        let messagesTopCenter = [];
        const { to, accounts } = this.props;
        if (accounts[to]) {
            messagesTopCenter.push(<div style={{fontSize: '14px', width: '100%', textAlign: 'center'}}>
                <a href={'/@' + to}>{to}</a>
            </div>);
            const dates = [
                accounts[to].last_custom_json_bandwidth_update,
                accounts[to].last_post,
                accounts[to].last_comment,
                accounts[to].created,
            ];
            let lastSeen = max(dates);
            if (!lastSeen.startsWith('19')) {
                messagesTopCenter.push(<div style={{fontSize: '12px', fontWeight: 'normal'}}>
                    {
                        <span>
                            {tt('messages.last_seen')}
                            <TimeAgoWrapper date={`${lastSeen}`} />
                        </span>
                    }
                </div>);
            }
        }
        return messagesTopCenter;
    };

    render() {
        const { contacts, account, to } = this.props;
        if (!contacts || !account) return (<div></div>);
        return (<Messenger
            account={this.props.account}
            to={to}
            contacts={this.state.searchContacts || this.state.contacts}
            conversationTopLeft={[
                <a href='/'>
                    <h4>GOLOS</h4>
                </a>
            ]}
            conversationLinkPattern='/msgs/@*'
            onConversationSearch={this.onConversationSearch}
            messages={this.state.messages}
            messagesTopCenter={this._renderMessagesTopCenter()}
            onSendMessage={this.onSendMessage} />);
    }
}

module.exports = {
    path: '/msgs(/:to)',
    component: connect(
        (state, ownProps) => {
            const currentUser = state.user.get('current');
            const accounts = state.global.get('accounts');
            const contacts = state.global.get('contacts');
            const messages = state.global.get('messages');

            let to = ownProps.routeParams.to;
            if (to) to = to.replace('@', '');

            let memo_private = null;
            if (currentUser) {
                memo_private = currentUser.getIn(['private_keys', 'memo_private']);
            }

            return {
                to,
                contacts: contacts,
                messages: messages,
                account: currentUser && accounts.toJS()[currentUser.get('username')],
                currentUser,
                memo_private,
                accounts: accounts ?  accounts.toJS() : {},
            };
        },
        dispatch => ({
            checkMemo: (currentUser) => {
                const private_key = currentUser.getIn(['private_keys', 'memo_private']);
                if (!private_key) {
                    dispatch(user.actions.showLogin({
                        loginDefault: { username: currentUser.get('username'), authType: 'memo' }
                    }));
                    return false;
                }
                return true;
            },
            sendMessage: (senderAcc, senderPrivMemoKey, toAcc, body) => {
                let message = {
                    app: 'golos-id',
                    version: 1,
                    body,
                };
                message = JSON.stringify(message);

                const data = golos.messages.encode(senderPrivMemoKey, toAcc.memo_key, message);

                const json = JSON.stringify(['private_message', {
                    from: senderAcc.name,
                    to: toAcc.name,
                    nonce: data.nonce.toString(),
                    from_memo_key: senderAcc.memo_key,
                    to_memo_key: toAcc.memo_key,
                    checksum: data.checksum,
                    update: false,
                    encrypted_message: data.message,
                }]);
                dispatch(transaction.actions.broadcastOperation({
                    type: 'custom_json',
                    operation: {
                        id: 'private_message',
                        required_posting_auths: [senderAcc.name],
                        json,
                        message: message,
                    },
                    successCallback: null,
                    errorCallback: null,
                }));
            }
        })
    )(Messages),
};
