import React from 'react';
import Dropzone from 'react-dropzone';

import ConversationList from '../ConversationList';
import MessageList from '../MessageList';
import './Messenger.css';

export default class Messages extends React.Component {
    onDrop = (acceptedFiles, rejectedFiles, event) => {
        if (this.props.onImageDropped) {
            this.props.onImageDropped(acceptedFiles, rejectedFiles, event);
        }
    };

    render() {
        const { account, to,
            contacts, conversationTopLeft, conversationLinkPattern,
            onConversationAdd, onConversationSearch, onConversationSelect,
            messagesTopLeft, messagesTopCenter, messagesTopRight, messages, replyingMessage, onCancelReply, onSendMessage,
            onButtonImageClicked, onImagePasted,
            selectedMessages, onMessageSelect, onPanelDeleteClick, onPanelReplyClick, onPanelEditClick, onPanelCloseClick } = this.props;

        let isMobile = false;
        if (process.env.BROWSER) {
            isMobile = window.matchMedia('screen and (max-width: 39.9375em)').matches;
        }

        return (
            <Dropzone
                className='messenger-dropzone'
                disableClick
                multiple={false}
                accept='image/*'
                disabled={!to}
                onDrop={this.onDrop}
            >
                {(dropzoneParams) => (<div className='messenger'>
                    {(!isMobile || !to) ? <div className='msgs-scrollable msgs-sidebar'>
                        <ConversationList
                            conversationTopLeft={conversationTopLeft}
                            account={account}
                            conversations={contacts}
                            conversationSelected={to}
                            conversationLinkPattern={conversationLinkPattern}
                            onConversationAdd={onConversationAdd}
                            onConversationSearch={onConversationSearch}
                            onConversationSelect={onConversationSelect}
                            />
                    </div> : null}

                    {(!isMobile || to) ? <div className='msgs-scrollable msgs-content'>
                        <MessageList
                            account={account}
                            to={to}
                            topLeft={messagesTopLeft}
                            topCenter={messagesTopCenter}
                            topRight={messagesTopRight}
                            messages={messages}
                            replyingMessage={replyingMessage}
                            onCancelReply={onCancelReply}
                            onSendMessage={onSendMessage}
                            selectedMessages={selectedMessages}
                            onMessageSelect={onMessageSelect}
                            onPanelDeleteClick={onPanelDeleteClick}
                            onPanelReplyClick={onPanelReplyClick}
                            onPanelEditClick={onPanelEditClick}
                            onPanelCloseClick={onPanelCloseClick}
                            onButtonImageClicked={onButtonImageClicked}
                            onImagePasted={onImagePasted}
                            />
                    </div> : null}

                    {dropzoneParams.isDragActive ? (<div className='messenger-dropzone-shade'>
                        <div className='messenger-dropzone-modal'>
                            Test
                        </div>
                    </div>) : null}
                </div>)}
            </Dropzone>
        );
    }
}
