import React from 'react';
import golos from 'golos-classic-js';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { browserHistory } from 'react-router';
import max from 'lodash/max';
import debounce from 'lodash/debounce';
import tt from 'counterpart';
import Icon from 'app/components/elements/Icon';
import MarkNotificationRead from 'app/components/elements/MarkNotificationRead';
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper';
import DialogManager from 'app/components/elements/common/DialogManager';
import AddImageDialog from '../dialogs/AddImageDialog';
let Messenger;
if (process.env.BROWSER)
    Messenger = require('app/components/modules/messages/Messenger').default;
import transaction from 'app/redux/Transaction';
import g from 'app/redux/GlobalReducer';
import user from 'app/redux/User';
import { getProfileImage } from 'app/utils/NormalizeProfile';

function getProfileImageLazy(account, cachedProfileImages) {
    let cached = cachedProfileImages[account.name];
    if (cached) 
        return cached;
    const image = getProfileImage(account);
    cachedProfileImages[account.name] = image;
    return image;
}

function normalizeContacts(contacts, accounts, currentUser, preDecoded, cachedProfileImages) {
    if (!currentUser || !accounts)
        return [];

    const currentAcc = accounts[currentUser.get('username')];
    if (!currentAcc)
        return [];

    const private_key = currentUser.getIn(['private_keys', 'memo_private']);

    let contactsCopy = contacts ? [...contacts.toJS()] : [];
    for (let contact of contactsCopy) {
        let account = accounts && accounts[contact.contact];
        contact.avatar = getProfileImageLazy(account, cachedProfileImages);

        if (contact.last_message.create_date.startsWith('1970')) {
            contact.last_message.message = "";
            continue;
        }

        let public_key;
        if (currentAcc.memo_key === contact.last_message.to_memo_key) {
            public_key = contact.last_message.from_memo_key;
        } else {
            public_key = contact.last_message.to_memo_key;
        }

        try {
            golos.messages.decode(private_key, public_key, [contact.last_message],
                (msg) => {
                    const decoded = JSON.parse(msg.message);
                    msg.message = decoded.body;

                    preDecoded[msg.nonce] = decoded;
                }, 0, 1, undefined, (msg, i, results) => {
                    let pd = preDecoded[msg.nonce];
                    if (pd) {
                        msg.message = pd.body;
                        return false;
                    }
                    return true;
                });
        } catch (ex) {
            console.log(ex);
        }
    }
    return contactsCopy
}

function normalizeMessages(messages, accounts, currentUser, to, preDecoded) {
    if (!to || !accounts[to]) {
        return [];
    }
    let messagesCopy = messages ? [...messages.toJS()] : [];

    let id = 0;
    try {
        const private_key = currentUser.getIn(['private_keys', 'memo_private']);

        let currentAcc = accounts[currentUser.get('username')];

        let messagesCopy2 = golos.messages.decode(private_key, accounts[to].memo_key, messagesCopy,
            (msg) => {
                const decoded = JSON.parse(msg.message);
                msg.message = decoded.body;
                msg.type = decoded.type || 'text';

                preDecoded[msg.nonce] = decoded;

                return true;
            }, messagesCopy.length - 1, -1,
            (msg, i, err) => {
                console.log(err);
            },
            (msg, i, results) => {
                msg.id = ++id;
                msg.author = msg.from;
                msg.date = new Date(msg.receive_date + 'Z');

                if (currentAcc.memo_key === msg.to_memo_key) {
                    if (msg.read_date.startsWith('19')) {
                        msg.toMark = true;
                    }
                } else {
                    if (msg.read_date.startsWith('19')) {
                        msg.unread = true;
                    }
                }

                let pd = preDecoded[msg.nonce];
                if (pd) {
                    msg.message = pd.body;
                    msg.type = pd.type;
                    results.push(msg);
                    return false;
                }
                return true;
            });

        return messagesCopy2;
    } catch (ex) {
        console.log(ex);
        return [];
    }
}

class Messages extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            contacts: [],
            messages: [],
            messagesCount: 0,
            selectedMessages: {},
            searchContacts: null,
        };
        this.preDecoded = {};
        this.cachedProfileImages = {};
    }

    markMessages() {
        const { messages } = this.state;
        if (!messages.length) return;

        const { account, accounts, to } = this.props;

        let OPERATIONS = golos.messages.make_groups(messages, (message_object, idx) => {
            return message_object.toMark;
        }, (group, indexes, results) => {
            const json = JSON.stringify(['private_mark_message', {
                from: accounts[to].name,
                to: account.name,
                ...group,
            }]);
            return ['custom_json',
                {
                    id: 'private_message',
                    required_posting_auths: [account.name],
                    json,
                }
            ];
        }, messages.length - 1, -1);

        this.props.sendOperations(account, accounts[to], OPERATIONS);
    }

    markMessages2 = debounce(this.markMessages, 1000);

    setCallback(account) {
        golos.api.setPrivateMessageCallback({select_accounts: [account.name]},
            (err, result) => {
                if (err) {
                    this.setCallback(this.props.account || account);
                    return;
                }
                if (!result || !result.message) {
                    return;
                }
                const updateMessage = result.message.from === this.props.to || 
                    result.message.to === this.props.to;
                const isMine = account.name === result.message.from;
                if (result.type === 'message') {
                    if (result.message.create_date !== result.message.receive_date) {
                        this.props.messageEdited(result.message, updateMessage, isMine);
                    } else if (this.nonce != result.message.nonce) {
                        this.props.messaged(result.message, updateMessage, isMine);
                        this.nonce = result.message.nonce
                    }
                } else if (result.type === 'mark') {
                    this.props.messageRead(result.message, updateMessage, isMine);
                } else if (result.type === 'remove_outbox' || result.type === 'remove_inbox') {
                    this.props.messageDeleted(result.message, updateMessage, isMine);
                }
            });
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.account && !this.props.account
            || (nextProps.account && this.props.account && nextProps.account.name !== this.props.account.name)) {
            const { account } = nextProps;
            this.setCallback(account);
        }
        if (nextProps.messages.size !== this.props.messages.size
            || nextProps.messages_update !== this.props.messages_update
            || nextProps.to !== this.state.to
            || nextProps.contacts.size !== this.props.contacts.size
            || nextProps.memo_private !== this.props.memo_private) {
            const { contacts, messages, accounts, currentUser } = nextProps;
            if (!currentUser) return;
            if (!this.props.checkMemo(currentUser)) {
                this.setState({
                    to: nextProps.to, // protects from infinity loop
                });
                return;
            }
            const anotherChat = nextProps.to !== this.state.to;
            const anotherKey = nextProps.memo_private !== this.props.memo_private;
            const added = nextProps.messages.size > this.state.messagesCount;
            let scrollTimeout = this.props.messages.size ? 1 : 1000;
            this.setState({
                to: nextProps.to,
                contacts: normalizeContacts(contacts, accounts, currentUser, this.preDecoded, this.cachedProfileImages),
                messages: normalizeMessages(messages, accounts, currentUser, this.props.to, this.preDecoded),
                messagesCount: messages.size,
            }, () => {
                if (added)
                    this.markMessages2();
                setTimeout(() => {
                    if (added) {
                        const scroll = document.getElementsByClassName('scrollable')[1];
                        if (scroll) scroll.scrollTo(0,scroll.scrollHeight);
                    }
                    if (anotherChat || anotherKey) {
                        this.focusInput();
                    }
                }, scrollTimeout);
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
            account.avatar = getProfileImage(account, this.cachedProfileImages);
            contacts.push(account);
        }
        if (contacts.length === 0) {
            contacts = [{
                contact: tt('messages.search_not_found'),
                isSystemMessage: true
            }];
        }
        this.setState({
            searchContacts: contacts
        });

        if (this.searchHider) {
            clearTimeout(this.searchHider);
        }
        this.searchHider = setTimeout(() => {
            if (this.state.searchContacts) {
                this.setState({
                    searchContacts: null
                });
            }
        }, 10000);
    };

    onSendMessage = (message, event) => {
        if (!message.length) return;
        const { to, account, accounts, currentUser, messages } = this.props;
        const private_key = currentUser.getIn(['private_keys', 'memo_private']);

        if (this.editNonce) {
            delete this.preDecoded[this.editNonce];
        }

        this.props.sendMessage(account, private_key, accounts[to], message, this.editNonce);
        if (this.editNonce) {
            this.restoreInput();
            this.focusInput();
            this.editNonce = undefined;
        } else {
            this.setInput('');
        }
    };

    onMessageSelect = (message, idx, isSelected, event) => {
        if (message.receive_date.startsWith('19') || message.deleting) {
            this.focusInput();
            return;
        }
        if (isSelected) {
            this.presaveInput();
            const { account } = this.props;

            let selectedMessages = {...this.state.selectedMessages};

            if (event.shiftKey) {
                let msgs = Object.entries(selectedMessages);
                if (msgs.length) {
                    const lastSelected = msgs[msgs.length - 1][1].idx;
                    const step = idx > lastSelected ? 1 : -1;
                    for (let i = lastSelected + step; i != idx; i += step) {
                        let message = this.state.messages[i];
                        const isMine = account.name === message.from;
                        selectedMessages[message.nonce] = { editable: isMine, idx: i };
                    }
                }
            }

            const isMine = account.name === message.from;
            selectedMessages[message.nonce] = { editable: isMine, idx };

            if (Object.keys(selectedMessages).length > 10) {
                this.props.showError(tt('messages.cannot_select_too_much_messages'));
                return;
            }

            this.setState({
                selectedMessages,
            });
        } else {
            let selectedMessages = {...this.state.selectedMessages};
            delete selectedMessages[message.nonce];

            this.setState({
                selectedMessages,
            }, () => {
                this.restoreInput();
                this.focusInput();
            });
        }
    };

    onPanelDeleteClick = (event) => {
        const { messages } = this.state;

        const { account, accounts, to } = this.props;

        // TODO: works wrong if few messages have same create_time
        /*let OPERATIONS = golos.messages.make_groups(messages, (message_object, idx) => {
            return !!this.state.selectedMessages[message_object.nonce];
        }, (group, indexes, results) => {
            let from = '';
            let to = '';
            if (indexes.length === 1) {
                from = messages[indexes[0]].from;
                to = messages[indexes[0]].to;
            }
            const json = JSON.stringify(['private_delete_message', {
                requester: account.name,
                from,
                to,
                ...group,
            }]);
            return ['custom_json',
                {
                    id: 'private_message',
                    required_posting_auths: [account.name],
                    json,
                }
            ];
        }, messages.length - 1, -1);*/

        let OPERATIONS = [];
        for (let message_object of messages) {
            if (!this.state.selectedMessages[message_object.nonce]) {
                continue;
            }
            const json = JSON.stringify(['private_delete_message', {
                requester: account.name,
                from: message_object.from,
                to: message_object.to,
                start_date: '1970-01-01T00:00:00',
                stop_date: '1970-01-01T00:00:00',
                nonce: message_object.nonce,
            }]);
            OPERATIONS.push(['custom_json',
                {
                    id: 'private_message',
                    required_posting_auths: [account.name],
                    json,
                }
            ]);
        }

        this.props.sendOperations(account, accounts[to], OPERATIONS);

        this.setState({
            selectedMessages: {},
        }, () => {
            this.restoreInput();
            this.focusInput();
        });
    };

    onPanelEditClick = (event) => {
        const nonce = Object.keys(this.state.selectedMessages)[0];
        let message = this.state.messages.filter(message => {
            return message.nonce === nonce;
        });
        this.setState({
            selectedMessages: {},
        }, () => {
            this.editNonce = message[0].nonce;
            this.setInput(message[0].message);
            this.focusInput();
        });
    };

    onPanelCloseClick = (event) => {
        this.setState({
            selectedMessages: {},
        }, () => {
            this.restoreInput();
            this.focusInput();
        });
    };

    onButtonImageClicked = (event) => {
        DialogManager.showDialog({
            component: AddImageDialog,
            onClose: (data) => {
                if (!data) {
                    this.focusInput();
                    return;
                }

                let sendImageMessage = (url) => {
                    if (!url)
                        return;

                    const { to, account, accounts, currentUser, messages } = this.props;
                    const private_key = currentUser.getIn(['private_keys', 'memo_private']);
                    this.props.sendMessage(account, private_key, accounts[to], url, undefined, 'image');
                };

                if (data.file) {
                    this.props.uploadImage({
                        file: data.file,
                        progress: data => {
                            if (data.url) {
                                sendImageMessage(data.url);
                                this.focusInput();
                            }
                        }
                    });
                } else if (data.url) {
                    let url = $STM_Config.img_proxy_prefix + '0x0/' + data.url;
                    let img = new Image();
                    img.onerror = img.onabort = () => {
                        this.props.showError(tt('messages.cannot_load_image_try_again'));
                    };
                    img.onload = () => {
                        sendImageMessage(data.url);
                        this.focusInput();
                    };
                    img.src = url;
                    console.log(url)
                }
            },
        });
    };

    focusInput = () => {
        const input = document.getElementsByClassName('compose-input')[0];
        if (input) input.focus();
    };

    presaveInput = () => {
        if (!this.presavedInput) {
            const input = document.getElementsByClassName('compose-input')[0];
            if (input) {
                this.presavedInput = input.value;
            }
        }
    };

    setInput = (value) => {
        const input = document.getElementsByClassName('compose-input')[0];
        if (input) {
            input.value = value;
        }
    };

    restoreInput = () => {
        if (this.presavedInput) {
            this.setInput(this.presavedInput);
            this.presavedInput = undefined;
        }
    };

    _renderMessagesTopCenter = () => {
        let messagesTopCenter = [];
        const { to, accounts } = this.props;
        if (accounts[to]) {
            messagesTopCenter.push(<div key='to-link' style={{fontSize: '14px', width: '100%', textAlign: 'center'}}>
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
                messagesTopCenter.push(<div key='to-last-seen' style={{fontSize: '12px', fontWeight: 'normal'}}>
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
        return (<div>
                {Messenger ? (<Messenger
                    account={this.props.account}
                    to={to}
                    contacts={this.state.searchContacts || this.state.contacts}
                    conversationTopLeft={[
                        <a href='/' key='logo'>
                            <h4>GOLOS</h4>
                            <MarkNotificationRead fields='message' account={account.name} />
                        </a>
                    ]}
                    conversationLinkPattern='/msgs/@*'
                    onConversationSearch={this.onConversationSearch}
                    messages={this.state.messages}
                    messagesTopCenter={this._renderMessagesTopCenter()}
                    onSendMessage={this.onSendMessage}
                    selectedMessages={this.state.selectedMessages}
                    onMessageSelect={this.onMessageSelect}
                    onPanelDeleteClick={this.onPanelDeleteClick}
                    onPanelEditClick={this.onPanelEditClick}
                    onPanelCloseClick={this.onPanelCloseClick}
                    onButtonImageClicked={this.onButtonImageClicked}
                />) : null}
            </div>);
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
            const messages_update = state.global.get('messages_update');

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
                messages_update,
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
            sendOperations: (senderAcc, toAcc, OPERATIONS) => {
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
            sendMessage: (senderAcc, senderPrivMemoKey, toAcc, body, nonce = undefined, type = 'text') => {
                let message = {
                    app: 'golos-id',
                    version: 1,
                    body,
                };
                if (type !== 'text') {
                    message.type = type;
                    if (type === 'image') {
                        // For clients who don't want use img proxy by themself
                        message.preview = $STM_Config.img_proxy_prefix + '600x300/' + body;
                    } else {
                        throw new Error('Unknown message type: ' + type);
                    }
                }
                message = JSON.stringify(message);

                const data = golos.messages.encode(senderPrivMemoKey, toAcc.memo_key, message, nonce || undefined);

                const json = JSON.stringify(['private_message', {
                    from: senderAcc.name,
                    to: toAcc.name,
                    nonce: nonce || data.nonce.toString(),
                    from_memo_key: senderAcc.memo_key,
                    to_memo_key: toAcc.memo_key,
                    checksum: data.checksum,
                    update: nonce ? true : false,
                    encrypted_message: data.encrypted_message,
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
            messaged: (message, updateMessage, isMine) => {
                dispatch(g.actions.messaged({message, updateMessage, isMine}));
            },
            messageEdited: (message, updateMessage, isMine) => {
                dispatch(g.actions.messaged({message, updateMessage, isMine}));
            },
            messageRead: (message, updateMessage, isMine) => {
                dispatch(g.actions.messageRead({message, updateMessage, isMine}));
            },
            messageDeleted: (message, updateMessage, isMine) => {
                dispatch(g.actions.messageDeleted({message, updateMessage, isMine}));
            },
            uploadImage({ file, progress }) {
                dispatch({
                    type: 'user/UPLOAD_IMAGE',
                    payload: {
                        file,
                        progress: data => {
                            //console.log('progress:')
                            //console.log(data)
                            if (data && data.error) {
                                try {
                                    this.showError(JSON.parse(data.error).data.error || data.error);
                                } catch (ex) {
                                    this.showError(data.error);
                                }
                            }

                            progress(data);
                        },
                    },
                });
            },
            showError(error, dismissAfter = 5000) {
                dispatch({
                    type: 'ADD_NOTIFICATION',
                    payload: {
                        message: error,
                        dismissAfter,
                    },
                });
            }
        })
    )(Messages),
};
