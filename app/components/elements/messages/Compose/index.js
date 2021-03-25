import React from 'react';
import tt from 'counterpart';
import { Picker } from 'emoji-picker-element';

import './Compose.css';

export default class Compose extends React.Component {
    onSendMessage = (e) => {
        if (e.keyCode === 13) {
            if (e.shiftKey) {
            } else {
                e.preventDefault();
                const { onSendMessage } = this.props;
                onSendMessage(e.target.value, e);
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

        setTimeout(() => {
            const button = document.querySelector('.emoji-picker-opener');
            button.addEventListener('click', this.onEmojiClick);
            document.body.addEventListener('click', this.onBodyClick);
        }, 500);
    }

    onEmojiClick = (event) => {
        event.stopPropagation();
        this._tooltip.classList.toggle('shown');
        if (!this._tooltip.classList.contains('shown')) {
            const input = document.getElementsByClassName('compose-input')[0];
            if (input) {
                input.focus();
            }
        }
    };

    onBodyClick = (event) => {
        if (!this._tooltip) return;
        if (event.target.tagName.toLowerCase() === 'emoji-picker') return;
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
        event.stopPropagation();
        this._tooltip.classList.toggle('shown');

        const input = document.getElementsByClassName('compose-input')[0];
        if (input) {
            input.focus();
            this.insertAtCursor(input, ' ' + event.detail.unicode + ' ');
        }
    };

    onPanelDeleteClick = (event) => {
        if (this.props.onPanelDeleteClick) {
            this.props.onPanelDeleteClick(event);
        }
    }

    onPanelEditClick = (event) => {
        if (this.props.onPanelEditClick) {
            this.props.onPanelEditClick(event);
        }
    }

    onPanelCloseClick = (event) => {
        if (this.props.onPanelCloseClick) {
            this.props.onPanelCloseClick(event);
        }
    }

    render() {
        const { account, rightItems } = this.props;
        const { onPanelDeleteClick, onPanelEditClick, onPanelCloseClick } = this;

        const selectedMessages = Object.entries(this.props.selectedMessages);
        let selectedMessagesCount = 0;
        let selectedEditablesCount = 0;
        for (let [nonce, info] of selectedMessages) {
            selectedMessagesCount++;
            if (info.editable) {
                selectedEditablesCount++;
            }
        }

        return (
            <div className='compose'>
                {
                    !selectedMessagesCount ? rightItems : null
                }

                {!selectedMessagesCount ? (<textarea
                    className='compose-input'
                    placeholder={tt('messages.type_a_message_NAME', {NAME: account.name})}
                    onKeyDown={this.onSendMessage}
                />) : null}

                {selectedMessagesCount ? (<div className='compose-panel'>
                    <button className='button hollow small alert' onClick={onPanelDeleteClick}>{tt('g.delete') + ' (' + selectedMessagesCount + ')'}</button>
                    {(selectedMessagesCount === 1 && selectedEditablesCount === 1) ? (<button className='button hollow small' onClick={onPanelEditClick}>{tt('g.edit')}</button>) : null}
                    <button className='button hollow small cancel-button' onClick={onPanelCloseClick}>{tt('g.cancel')}</button>
                </div>) : null}
            </div>
        );
    }
}
