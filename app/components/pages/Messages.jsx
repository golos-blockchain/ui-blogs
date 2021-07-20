import React from 'react';
import golos from 'golos-classic-js';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { LinkWithDropdown } from 'react-foundation-components/lib/global/dropdown';
import { browserHistory } from 'react-router';
import debounce from 'lodash/debounce';
import tt from 'counterpart';
import Icon from 'app/components/elements/Icon';
import MarkNotificationRead from 'app/components/elements/MarkNotificationRead';
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper';
import Userpic from 'app/components/elements/Userpic';
import VerticalMenu from 'app/components/elements/VerticalMenu';
import NotifiCounter from 'app/components/elements/NotifiCounter';
import DialogManager from 'app/components/elements/common/DialogManager';
import AddImageDialog from '../dialogs/AddImageDialog';
let Messenger;
if (process.env.BROWSER)
    Messenger = require('app/components/modules/messages/Messenger').default;
import PageFocus from 'app/components/elements/messages/PageFocus';
import transaction from 'app/redux/Transaction';
import g from 'app/redux/GlobalReducer';
import user from 'app/redux/User';
import { getProfileImage, getLastSeen } from 'app/utils/NormalizeProfile';
import { fitToPreview } from 'app/utils/ImageUtils';
import { proxifyImageUrl } from 'app/utils/ProxifyUrl';
import { notificationSubscribe, notificationTake, sendOffchainMessage } from 'app/utils/NotifyApiClient';
import { flash, unflash } from 'app/components/elements/messages/FlashTitle';
import { APP_NAME_UP, APP_ICON } from 'app/client_config';

function getProfileImageLazy(account, cachedProfileImages) {
    if (!account)
        return getProfileImage(null);
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

    const tt_invalid_message = tt('messages.invalid_message');

    let contactsCopy = contacts ? [...contacts.toJS()] : [];
    for (let contact of contactsCopy) {
        let account = accounts && accounts[contact.contact];
        contact.avatar = getProfileImageLazy(account, cachedProfileImages);

        if (contact.last_message.create_date.startsWith('1970')) {
            contact.last_message.message = { body: '', };
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
                (msg, idx, results) => {
                    if (msg.read_date.startsWith('19') && msg.from === currentAcc.name) {
                        msg.unread = true;
                    }
                    let pd = preDecoded[msg.nonce + '' + msg.receive_date];
                    if (pd) {
                        msg.message = pd;
                        return true;
                    }
                    return false;
                }, (msg) => {
                    preDecoded[msg.nonce + '' + msg.receive_date] = msg.message;
                }, (msg, idx, exception) => {
                    msg.message = { body: tt_invalid_message, invalid: true, };
                }, 0, 1);
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

        const tt_invalid_message = tt('messages.invalid_message');

        let messagesCopy2 = golos.messages.decode(private_key, accounts[to].memo_key, messagesCopy,
            (msg, i, results) => {
                msg.id = ++id;
                msg.author = msg.from;
                msg.date = new Date(msg.create_date + 'Z');

                if (msg.to === currentAcc.name) {
                    if (msg.read_date.startsWith('19')) {
                        msg.toMark = true;
                    }
                } else {
                    if (msg.read_date.startsWith('19')) {
                        msg.unread = true;
                    }
                }

                let pd = preDecoded[msg.nonce + '' + msg.receive_date];
                if (pd) {
                    msg.message = pd;
                    results.push(msg);
                    return true;
                }
                return false;
            },
            (msg) => {
                preDecoded[msg.nonce + '' + msg.receive_date] = msg.message;
            },
            (msg, i, err) => {
                console.log(err);
                msg.message = {body: tt_invalid_message, invalid: true};
            },
            messagesCopy.length - 1, -1);

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
            notifyErrors: 0,
        };
        this.preDecoded = {};
        this.cachedProfileImages = {};
        this.windowFocused = true;
        this.newMessages = 0;
        setTimeout(() => {
            if (!this.props.username) {
                this.props.checkMemo(this.props.currentUser);
            }
        }, 1500);
    }

    markMessages() {
        const { messages } = this.state;
        if (!messages.length) return;

        const { account, accounts, to } = this.props;

        let OPERATIONS = golos.messages.makeDatedGroups(messages, (message_object, idx) => {
            return message_object.toMark && !message_object._offchain;
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

    flashMessage() {
        ++this.newMessages;

        let title = this.newMessages;
        const plural = this.newMessages % 10;

        if (plural === 1) {
            if (this.newMessages === 11)
                title += tt('messages.new_message5');
            else
                title += tt('messages.new_message1');
        } else if ((plural === 2 || plural === 3 || plural === 4) && (this.newMessages < 10 || this.newMessages > 20)) {
            title += tt('messages.new_message234');
        } else {
            title += tt('messages.new_message5');
        }

        flash(title);
    }

    notifyErrorsClear = () => {
        if (this.state.notifyErrors)
            this.setState({
                notifyErrors: 0,
            });
    };

    notifyErrorsInc = (score) => {
        this.setState({
            notifyErrors: this.state.notifyErrors + score,
        });
    };

    async setCallback(account, removeTaskIds) {
        let subscribed = null;
        try {
            subscribed = await notificationSubscribe(account.name);
        } catch (ex) {
            console.error('notificationSubscribe', ex);
            this.notifyErrorsInc(15);
            setTimeout(() => {
                this.setCallback(this.props.account || account, removeTaskIds);
            }, 5000);
            return;
        }
        if (subscribed) { // if was not already subscribed
            this.notifyErrorsClear();
        }
        try {
            removeTaskIds = await notificationTake(account.name, removeTaskIds, (type, op, timestamp, task_id, scope) => {
                if (scope !== 'message') {
                    return;
                }
                const updateMessage = op.from === this.state.to || 
                    op.to === this.state.to;
                const isMine = account.name === op.from;
                if (type === 'private_message') {
                    if (op.update) {
                        this.props.messageEdited(op, timestamp, updateMessage, isMine);
                    } else if (this.nonce !== op.nonce) {
                        this.props.messaged(op, timestamp, updateMessage, isMine);
                        this.nonce = op.nonce
                        if (!isMine && !this.windowFocused) {
                            this.flashMessage();
                        }
                    }
                } else if (type === 'private_delete_message') {
                    this.props.messageDeleted(op, updateMessage, isMine);
                } else if (type === 'private_mark_message') {
                    this.props.messageRead(op, timestamp, updateMessage, isMine);
                }
            });
            this.setCallback(this.props.account || account, removeTaskIds);
        } catch (ex) {
            console.error('notificationTake', ex);
            this.notifyErrorsInc(1);
            setTimeout(() => {
                this.setCallback(this.props.account || account, removeTaskIds);
            }, 1000);
            return;
        }
        this.notifyErrorsClear();
    }

    onWindowResize = (e) => {
        const isMobile = window.matchMedia('screen and (max-width: 39.9375em)').matches;
        if (isMobile != this.isMobile) {
            this.forceUpdate();
        }
        this.isMobile = isMobile;
    };

    componentDidMount() {
        window.addEventListener('resize', this.onWindowResize);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.onWindowResize);
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        if (nextProps.account && !this.props.account
            || (nextProps.account && this.props.account && nextProps.account.name !== this.props.account.name)) {
            this.props.fetchState(nextProps.to);
            const { account } = nextProps;
            this.setCallback(account);
        }
        if (nextProps.messages.size !== this.props.messages.size
            || nextProps.messages_update !== this.props.messages_update
            || nextProps.to !== this.state.to
            || nextProps.contacts.size !== this.props.contacts.size
            || nextProps.memo_private !== this.props.memo_private) {
            const { contacts, messages, accounts, currentUser } = nextProps;
            if (!this.props.checkMemo(currentUser)) {
                this.setState({
                    to: nextProps.to, // protects from infinity loop
                });
                return;
            }
            const anotherChat = nextProps.to !== this.state.to;
            const anotherKey = nextProps.memo_private !== this.props.memo_private;
            const added = nextProps.messages.size > this.state.messagesCount;
            let focusTimeout = this.props.messages.size ? 1 : 1000;
            this.setState({
                to: nextProps.to,
                contacts: normalizeContacts(contacts, accounts, currentUser, this.preDecoded, this.cachedProfileImages),
                messages: normalizeMessages(messages, accounts, currentUser, this.props.to, this.preDecoded),
                messagesCount: messages.size,
            }, () => {
                if (added)
                    this.markMessages2();
                setTimeout(() => {
                    if (anotherChat || anotherKey) {
                        this.focusInput();
                    }
                }, focusTimeout);
                if (anotherChat && this.state.replyingMessage) {
                    this.setState({
                        replyingMessage: null,
                    });
                }
            });
        }
    }

    onConversationSearch = async (query, event) => {
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

    onCancelReply = (event) => {
        this.setState({
            replyingMessage: null,
        }, () => {
            // if editing - cancel edit at all, not just remove reply
            if (this.editNonce) {
                this.restoreInput();
                this.editNonce = undefined;
            }
            this.focusInput();
        });
    };

    onSendMessage = (message, event) => {
        if (!message.length) return;
        const { to, account, accounts, currentUser, messages } = this.props;
        const private_key = currentUser.getIn(['private_keys', 'memo_private']);

        let editInfo;
        if (this.editNonce) {
            editInfo = { nonce: this.editNonce };
        }

        this.props.sendMessage(account, private_key, accounts[to], message, editInfo, 'text', {}, this.state.replyingMessage);
        if (this.editNonce) {
            this.restoreInput();
            this.focusInput();
            this.editNonce = undefined;
        } else {
            this.setInput('');
        }
        if (this.state.replyingMessage)
            this.setState({
                replyingMessage: null,
            });
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

            let selectMessage = (msg, idx) => {
                const isMine = account.name === msg.from;
                let isImage = false;
                let isInvalid = true;
                const { message } = msg;
                if (message) {
                    isImage = message.type === 'image';
                    isInvalid = !!message.invalid;
                }
                selectedMessages[msg.nonce] = {
                    editable: isMine && !isImage && !isInvalid, idx };
            };

            if (event.shiftKey) {
                let msgs = Object.entries(selectedMessages);
                if (msgs.length) {
                    const lastSelected = msgs[msgs.length - 1][1].idx;
                    const step = idx > lastSelected ? 1 : -1;
                    for (let i = lastSelected + step; i != idx; i += step) {
                        let message = this.state.messages[i];
                        selectMessage(message, i);
                    }
                }
            }

            selectMessage(message, idx);

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
                if (!Object.keys(selectedMessages).length) {
                    this.restoreInput();
                    this.focusInput();
                }
            });
        }
    };

    onPanelDeleteClick = (event) => {
        const { messages } = this.state;

        const { account, accounts, to } = this.props;

        // TODO: works wrong if few messages have same create_time
        /*let OPERATIONS = golos.messages.makeDatedGroups(messages, (message_object, idx) => {
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

    onPanelReplyClick = (event) => {
        const nonce = Object.keys(this.state.selectedMessages)[0];
        let message = this.state.messages.filter(message => {
            return message.nonce === nonce;
        });
        // (additional protection - normally invalid messages shouldn't be available for select)
        if (!message[0].message)
            return;
        let quote = golos.messages.makeQuoteMsg({}, message[0]);
        this.setState({
            selectedMessages: {},
            replyingMessage: quote,
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
        // (additional protection - normally invalid messages shouldn't be available for select)
        if (!message[0].message)
            return;
        this.setState({
            selectedMessages: {},
        }, () => {
            this.editNonce = message[0].nonce;
            if (message[0].message.quote) {
                this.setState({
                    replyingMessage: {quote: message[0].message.quote},
                });
            } else {
                this.setState({
                    replyingMessage: null,
                });
            }
            this.setInput(message[0].message.body);
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

    uploadImage = (imageFile, imageUrl) => {
        let sendImageMessage = (url, width, height) => {
            if (!url)
                return;

            const { to, account, accounts, currentUser, messages } = this.props;
            const private_key = currentUser.getIn(['private_keys', 'memo_private']);
            this.props.sendMessage(account, private_key, accounts[to], url, undefined, 'image', {width, height}, this.state.replyingMessage);

            if (this.state.replyingMessage)
                this.setState({
                    replyingMessage: null,
                });
        };

        if (imageFile) {
            this.props.uploadImage({
                file: imageFile,
                progress: data => {
                    if (data.url) {
                        sendImageMessage(data.url, data.width, data.height);
                        this.focusInput();
                    }
                }
            });
        } else if (imageUrl) {
            let url = proxifyImageUrl(imageUrl);
            let img = new Image();
            img.onerror = img.onabort = () => {
                this.props.showError(tt('messages.cannot_load_image_try_again'));
            };
            img.onload = () => {
                sendImageMessage(url, img.width, img.height);
                this.focusInput();
            };
            img.src = url;
        }
    };

    onButtonImageClicked = (event) => {
        DialogManager.showDialog({
            component: AddImageDialog,
            onClose: (data) => {
                if (!data) {
                    this.focusInput();
                    return;
                }

                if (data.file) {
                    this.uploadImage(data.file);
                } else if (data.url) {
                    this.uploadImage(undefined, data.url);
                }
            },
        });
    };

    onImagePasted = (file, fileName) => {
        this.uploadImage(file);
    };

    onImageDropped = (acceptedFiles, rejectedFiles, event) => {
        const file = acceptedFiles[0];

        if (!file) {
            if (rejectedFiles.length) {
                DialogManager.alert(
                    tt('reply_editor.please_insert_only_image_files')
                );
            }
            return;
        }

        this.uploadImage(file);
    };

    focusInput = (workOnMobile = false) => {
        if (!workOnMobile && window.IS_MOBILE) return;
        const input = document.getElementsByClassName('msgs-compose-input')[0];
        if (input) input.focus();
    };

    presaveInput = () => {
        if (this.presavedInput === undefined) {
            const input = document.getElementsByClassName('msgs-compose-input')[0];
            if (input) {
                this.presavedInput = input.value;
            }
        }
    };

    setInput = (value) => {
        const input = document.getElementsByClassName('msgs-compose-input')[0];
        if (input) {
            input.value = value;
        }
    };

    restoreInput = () => {
        if (this.presavedInput !== undefined) {
            this.setInput(this.presavedInput);
            this.presavedInput = undefined;
        }
    };

    _renderMessagesTopLeft = () => {
        let messagesTopLeft = [];
        // mobile only
        messagesTopLeft.push(<Link to='/msgs/' key='back-btn' className='msgs-back-btn'>
            <Icon name='chevron-left' />
        </Link>);
        return messagesTopLeft;
    };

    _renderMessagesTopCenter = () => {
        let messagesTopCenter = [];
        const { to, accounts } = this.props;
        if (accounts[to]) {
            messagesTopCenter.push(<div key='to-link' style={{fontSize: '15px', width: '100%', textAlign: 'center'}}>
                <a href={'/@' + to}>{to}</a>
            </div>);
            const { notifyErrors } = this.state;
            if (notifyErrors >= 30) {
                messagesTopCenter.push(<div key='to-last-seen' style={{fontSize: '13px', fontWeight: 'normal', color: 'red'}}>
                    {
                        <span>
                            {tt('messages.sync_error')}
                        </span>
                    }
                </div>);
            } else {
                let lastSeen = getLastSeen(accounts[to]);
                if (lastSeen) {
                    messagesTopCenter.push(<div key='to-last-seen' style={{fontSize: '13px', fontWeight: 'normal'}}>
                        {
                            <span>
                                {tt('messages.last_seen')}
                                <TimeAgoWrapper date={`${lastSeen}`} />
                            </span>
                        }
                    </div>);
                }
            }
        }
        return messagesTopCenter;
    };

    _renderMessagesTopRight = () => {
        const { currentUser } = this.props;
        if (!currentUser) {
            return null;
        }

        const username = currentUser.get('username');
        const feedLink = `/@${username}/feed`;
        const accountLink = `/@${username}`;
        const repliesLink = `/@${username}/recent-replies`;
        const donatesLink = `/@${username}/donates-to`;
        const walletLink = `/@${username}/transfers`;

        let user_menu = [
            {link: feedLink, icon: 'new/home', value: tt('g.feed'), addon: <NotifiCounter fields='feed' />},
            {link: accountLink, icon: 'new/blogging', value: tt('g.blog')},
            {link: repliesLink, icon: 'new/answer', value: tt('g.replies'), addon: <NotifiCounter fields='comment_reply' />},
            {link: donatesLink, icon: 'editor/coin', value: tt('g.rewards'), addon: <NotifiCounter fields='donate' />},
            {link: walletLink, icon: 'new/wallet', value: tt('g.wallet'), addon: <NotifiCounter fields='send,receive' />},
            {link: '#', onClick: this.props.toggleNightmode, icon: 'editor/eye', value: tt('g.night_mode')},
            {link: '#', icon: 'new/logout', onClick: this.props.logout, value: tt('g.logout')},
        ];

        return (<LinkWithDropdown
                closeOnClickOutside
                dropdownPosition='bottom'
                dropdownAlignment='bottom'
                dropdownContent={<VerticalMenu className={'VerticalMenu_nav-profile'} items={user_menu} />}
            >
                <div 
            className='msgs-curruser'>
                <div className='msgs-curruser-notify-sink'>
                    <Userpic account={username} title={username} width={40} height={40} />
                    <div className='TopRightMenu__notificounter'><NotifiCounter fields='total' /></div>
                </div>
                <div className='msgs-curruser-name'>
                    {username}
                </div>
                </div>
            </LinkWithDropdown>);
    };

    handleFocusChange = isFocused => {
        this.windowFocused = isFocused;
        if (!isFocused) {
            if (this.newMessages) {
                flash();
            }
        } else {
            this.newMessages = 0;
            unflash();
        }
    }

    render() {
        const { contacts, account, to } = this.props;
        if (!contacts || !account) return (<div></div>);
        return (<div>
                <PageFocus onChange={this.handleFocusChange}>
                    {(focused) => (
                        <MarkNotificationRead fields='message' account={account.name}
                            interval={focused ? 5000 : null}
                        />)}
                </PageFocus>
                {Messenger ? (<Messenger
                    account={this.props.account}
                    to={to}
                    contacts={this.state.searchContacts || this.state.contacts}
                    conversationTopLeft={[
                        <a href='/' key='logo'>
                            <img className='msgs-logo' src='/images/messenger.png' />
                        </a>
                    ]}
                    conversationLinkPattern='/msgs/@*'
                    onConversationSearch={this.onConversationSearch}
                    messages={this.state.messages}
                    messagesTopLeft={this._renderMessagesTopLeft()}
                    messagesTopCenter={this._renderMessagesTopCenter()}
                    messagesTopRight={this._renderMessagesTopRight()}
                    replyingMessage={this.state.replyingMessage}
                    onCancelReply={this.onCancelReply}
                    onSendMessage={this.onSendMessage}
                    selectedMessages={this.state.selectedMessages}
                    onMessageSelect={this.onMessageSelect}
                    onPanelDeleteClick={this.onPanelDeleteClick}
                    onPanelReplyClick={this.onPanelReplyClick}
                    onPanelEditClick={this.onPanelEditClick}
                    onPanelCloseClick={this.onPanelCloseClick}
                    onButtonImageClicked={this.onButtonImageClicked}
                    onImagePasted={this.onImagePasted}
                    onImageDropped={this.onImageDropped}
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
            const username = state.user.getIn(['current', 'username']);

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
                username,
            };
        },
        dispatch => ({
            checkMemo: (currentUser) => {
                if (!currentUser) {
                    dispatch(user.actions.showLogin({
                        loginDefault: { cancelIsRegister: true, unclosable: true }
                    }));
                    return false;
                }
                const private_key = currentUser.getIn(['private_keys', 'memo_private']);
                if (!private_key) {
                    dispatch(user.actions.showLogin({
                        loginDefault: { username: currentUser.get('username'), authType: 'memo', unclosable: true }
                    }));
                    return false;
                }
                return true;
            },
            fetchState: (to) => {
                const pathname = 'msgs/' + (to ? ('@' + to) : '');
                dispatch({type: 'FETCH_STATE', payload: {pathname}});
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
            sendMessage: (senderAcc, senderPrivMemoKey, toAcc, body, editInfo = undefined, type = 'text', meta = {}, replyingMessage = null) => {
                let message = {
                    app: 'golos-messenger',
                    version: 1,
                    body,
                };
                if (type !== 'text') {
                    message.type = type;
                    if (type === 'image') {
                        message = { ...message, ...fitToPreview(600, 300, meta.width, meta.height), };
                    } else {
                        throw new Error('Unknown message type: ' + type);
                    }
                }
                if (replyingMessage) {
                    message = {...message, ...replyingMessage};
                }

                const data = golos.messages.encode(senderPrivMemoKey, toAcc.memo_key, message, editInfo ? editInfo.nonce : undefined);

                const opData = {
                    from: senderAcc.name,
                    to: toAcc.name,
                    nonce: editInfo ? editInfo.nonce : data.nonce,
                    from_memo_key: senderAcc.memo_key,
                    to_memo_key: toAcc.memo_key,
                    checksum: data.checksum,
                    update: editInfo ? true : false,
                    encrypted_message: data.encrypted_message,
                };

                if (!editInfo) {
                    try {
                        sendOffchainMessage(opData);
                    } catch (ex) {
                        console.error('sendOffchainMessage', ex);
                    }
                }

                const json = JSON.stringify(['private_message', opData]);
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
            messaged: (message, timestamp, updateMessage, isMine) => {
                dispatch(g.actions.messaged({message, timestamp, updateMessage, isMine}));
            },
            messageEdited: (message, timestamp, updateMessage, isMine) => {
                dispatch(g.actions.messageEdited({message, timestamp, updateMessage, isMine}));
            },
            messageRead: (message, timestamp, updateMessage, isMine) => {
                dispatch(g.actions.messageRead({message, timestamp, updateMessage, isMine}));
            },
            messageDeleted: (message, updateMessage, isMine) => {
                dispatch(g.actions.messageDeleted({message, updateMessage, isMine}));
            },
            uploadImage({ file, progress }) {
                this.showError(`${tt(
                    'user_saga_js.image_upload.uploading'
                )}...`, 5000, 'progress');
                dispatch({
                    type: 'user/UPLOAD_IMAGE',
                    payload: {
                        file,
                        progress: data => {
                            if (data && data.error) {
                                try {
                                    const error = JSON.parse(data.error).data.error;
                                    this.showError(error.message || error);
                                } catch (ex) {
                                    // unknown error format
                                    this.showError(data.error);
                                }
                            } else if (data && data.message && typeof data.message === 'string') {
                                this.showError(data.message, 5000, 'progress');
                            }

                            progress(data);
                        },
                    },
                });
            },
            showError(error, dismissAfter = 5000, key = 'error') {
                dispatch({
                    type: 'ADD_NOTIFICATION',
                    payload: {
                        message: error,
                        dismissAfter,
                        key,
                    },
                });
            },
            logout: e => {
                if (e) e.preventDefault();
                dispatch(user.actions.logout());
            },
            toggleNightmode: (e) => {
                if (e) e.preventDefault();
                dispatch(user.actions.toggleNightmode());
            },
        })
    )(Messages),
};
