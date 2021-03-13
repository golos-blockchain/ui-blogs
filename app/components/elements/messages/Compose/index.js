import React from 'react';
import tt from 'counterpart';

import './Compose.css';

export default class Compose extends React.Component {
    onSendMessage = (e) => {
        if (e.keyCode !== 13) return;
        const { onSendMessage } = this.props;
        onSendMessage(e.target.value, e);
    };

    render() {
        const { account, rightItems } = this.props;
        return (
            <div className='compose'>
                <input
                    type='text'
                    className='compose-input'
                    placeholder={tt('messages.type_a_message_NAME', {NAME: account.name})}
                    onKeyDown={this.onSendMessage}
                />

                {
                    rightItems
                }
            </div>
        );
    }
}
