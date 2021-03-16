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
import g from 'app/redux/GlobalReducer';
import user from 'app/redux/User';
import { getProfileImage } from 'app/utils/NormalizeProfile';

let preDecoded = {};

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
    console.log(messagesCopy.length)
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
            if (msg.read_date.startsWith('19')) {
                msg.toMark = true;
            }
        } else {
            public_key = msg.to_memo_key;
            if (msg.read_date.startsWith('19')) {
                msg.unread = true;
            }
        }

        try {
            const private_key = currentUser.getIn(['private_keys', 'memo_private']);
            let message = null;
            if (!preDecoded[msg.encrypted_message]) {
                message = golos.messages.decode(private_key, public_key, msg);
                preDecoded[msg.encrypted_message] = message;
            } else {
                message = preDecoded[msg.encrypted_message];
            }
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

    markMessages() {
        const { messages } = this.state;
        if (!messages.length) return;
        let ranges = [];
        let range = null;
        for (let i = messages.length - 1; i >=0; --i) {
            const message = messages[i];
            if (!range) {
                if (message.toMark) {
                    range = {
                        start_date: message.receive_date,
                        stop_date: message.receive_date,
                    };
                }
            } else {
                if (message.toMark) {
                    range.start_date = message.receive_date;
                } else {
                    ranges.push({...range});
                    range = null;
                }
            }
        }
        if (range) {
            ranges.push({...range});
        }
        const { account, accounts, to } = this.props;
        this.props.markMessages(account, accounts[to], ranges);
    }

    setCallback(account) {
        golos.api.setPrivateMessageCallback({select_accounts: [account.name]},
            (err, result) => {
                if (result && result.type === 'message') {
                    if (result.message.from === this.props.to || 
                        result.message.to === this.props.to)
                        if (this.nonce != result.message.nonce) {
                            this.props.messaged(result.message);
                            this.nonce = result.message.nonce
                        }
                }
                this.setCallback(this.props.account || account);
            });
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.account && !this.props.account
            || (nextProps.account && this.props.account && nextProps.account.name !== this.props.account.name)) {
            const { account } = nextProps;
            this.setCallback(account);
        }
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
            }, () => {
                this.markMessages();
                setTimeout(() => {
                    const scroll = document.getElementsByClassName('scrollable')[1];
                    if (scroll) scroll.scrollTo(0,scroll.scrollHeight);
                }, 1);
            });
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
            markMessages: (senderAcc, toAcc, ranges) => {
                let OPERATIONS = [];
                for (const r of ranges) {
                    const json = JSON.stringify(['private_mark_message', {
                        from: toAcc.name,
                        to: senderAcc.name,
                        nonce: 0,
                        start_date: new Date(new Date(r.start_date+'Z').getTime() - 1000).toISOString().split('.')[0],
                        stop_date: r.stop_date,
                    }]);
                    OPERATIONS.push(
                        ['custom_json',
                            {
                                id: 'private_message',
                                required_posting_auths: [senderAcc.name],
                                json,
                            }
                        ]);
                }
                if (!OPERATIONS.length) return;
                dispatch(
                    transaction.actions.broadcastOperation({
                        type: 'custom_json',
                        trx: OPERATIONS,
                        successCallback: null,
                        errorCallback: (e) => {
                            console.log(e);
                        }
                    })
                );
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
                    },
                    successCallback: null,
                    errorCallback: null,
                }));
            },
            messaged: (message) => {
                dispatch(g.actions.messaged({message}));
            }
        })
    )(Messages),
};
