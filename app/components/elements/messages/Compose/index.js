import React from 'react';
import tt from 'counterpart';
import { Picker } from 'emoji-picker-element';
import { createPopper } from '@popperjs/core';

import './Compose.css';

export default class Compose extends React.Component {
    onSendMessage = (e) => {
        if (e.keyCode === 13) {
            if (e.shiftKey) {
            } else {
                e.preventDefault();
                const { onSendMessage } = this.props;
                onSendMessage(e.target.value, e);  
                const input = document.getElementsByClassName('compose-input');
                if (input[0]) input[0].value = '';
            }
        }
    };

    componentDidMount() {
        this._picker = new Picker({
            locale: tt.getLocale(),
            i18n: tt('emoji_i18n'),
        });

        this._picker.addEventListener('emoji-click', this.onEmojiSelect);

        this._tooltip = document.querySelector('.emoji-picker-tooltip');
        this._tooltip.appendChild(this._picker);

        const button = document.querySelector('.emoji-picker-opener');
        createPopper(button, this._tooltip, {
            placement: 'top',
            strategy: 'fixed',
        });
        button.addEventListener('click', this.onEmojiClick);

        document.body.addEventListener('click', this.onBodyClick);
    }

    onEmojiClick = (event) => {
        this._tooltip.classList.add('shown')
    };

    onBodyClick = (event) => {
        if (event.target.localName === 'emoji-picker') return;
        if (event.target.classList.contains('emoji-picker-opener')) return;
        if (!this._tooltip) return;
        this._tooltip.classList.remove('shown');
    };

    insertAtCursor(myField, myValue) {
        //IE support
        if (document.selection) {
            myField.focus();
            let sel = document.selection.createRange();
            sel.text = myValue;
        }
        //MOZILLA and others
        else if (myField.selectionStart || myField.selectionStart === '0') {
            let startPos = myField.selectionStart;
            let endPos = myField.selectionEnd;
            myField.value = myField.value.substring(0, startPos)
                + myValue
                + myField.value.substring(endPos, myField.value.length);
        } else {
            myField.value += myValue;
        }
    }

    onEmojiSelect = (event) => {
        this._tooltip.classList.toggle('shown');

        const input = document.getElementsByClassName('compose-input')[0];
        if (input) {
            input.focus();
            this.insertAtCursor(input, ' ' + event.detail.unicode + ' ');
        }
    };

    render() {
        const { account, rightItems } = this.props;
        return (
            <div className='compose'>
                {
                    rightItems
                }

                <textarea
                    className='compose-input'
                    placeholder={tt('messages.type_a_message_NAME', {NAME: account.name})}
                    onKeyDown={this.onSendMessage}
                />
            </div>
        );
    }
}
