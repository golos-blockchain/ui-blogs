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
            messagesTopCenter, messagesTopRight, messages, onSendMessage,
            onButtonImageClicked, onImagePasted,
            selectedMessages, onMessageSelect, onPanelDeleteClick, onPanelEditClick, onPanelCloseClick } = this.props;
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
                    {/* <Toolbar
                        title='Messenger'
                        leftItems={[
                            <ToolbarButton key='cog' icon='ion-ios-cog' />
                        ]}
                        rightItems={[
                            <ToolbarButton key='add' icon='ion-ios-add-circle-outline' />
                        ]}
                    /> */}

                    {/* <Toolbar
                        title='Conversation Title'
                        rightItems={[
                            <ToolbarButton key='info' icon='ion-ios-information-circle-outline' />,
                            <ToolbarButton key='video' icon='ion-ios-videocam' />,
                            <ToolbarButton key='phone' icon='ion-ios-call' />
                        ]}
                    /> */}

                    <div className='msgs-scrollable msgs-sidebar'>
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
                    </div>

                    <div className='msgs-scrollable msgs-content'>
                        <MessageList
                            account={account}
                            to={to}
                            topCenter={messagesTopCenter}
                            topRight={messagesTopRight}
                            messages={messages}
                            onSendMessage={onSendMessage}
                            selectedMessages={selectedMessages}
                            onMessageSelect={onMessageSelect}
                            onPanelDeleteClick={onPanelDeleteClick}
                            onPanelEditClick={onPanelEditClick}
                            onPanelCloseClick={onPanelCloseClick}
                            onButtonImageClicked={onButtonImageClicked}
                            onImagePasted={onImagePasted}
                            />
                    </div>

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
