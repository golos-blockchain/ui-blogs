import React from 'react';
import ReactDOM from 'react-dom';
import tt from 'counterpart';
import { Picker, Database } from 'emoji-picker-element';
import { createPopper } from '@popperjs/core';

export default class EmojiPicker extends React.Component {
    _tooltip;
    _picker;
    _topEmojis = [];

    toggle = (event) => {
        this._tooltip.classList.toggle('shown')
    };

    selectEmoji = (event) => {
        if (this.props.onSelect) this.props.onSelect(event.target.dataset.emoji);
    };

    onSelect = (event) => {
        this._tooltip.classList.toggle('shown')
        if (this.props.onSelect) this.props.onSelect(event.detail.unicode);
    };

    onBodyClick = (event) => {
        if (event.target.localName === 'emoji-picker') return;
        if (event.target.className === 'emoji-picker-opener') return;
        this._tooltip.classList.remove('shown');
    };

    async componentDidMount() {
        const root = ReactDOM.findDOMNode(this);

        const button = root.querySelector('.emoji-picker-opener');
        this._tooltip = root.querySelector('.emoji-picker-tooltip');

        this._picker = new Picker({
            locale: tt.getLocale(),
            i18n: tt('emoji_i18n'),
        });

        this._picker.addEventListener('emoji-click', this.onSelect);

        this._tooltip.appendChild(this._picker);
        createPopper(button, this._tooltip, {
            placement: 'top',
            strategy: 'fixed'
        });

        document.body.addEventListener('click', this.onBodyClick);

        for (let node of this._picker.shadowRoot.childNodes) {
            if (!node.getElementsByClassName) continue;
            let row = node.getElementsByClassName('search-row');
            if (row.length) {
                row[0].parentNode.removeChild(row[0]);
                break;
            }
        }

        const updateTop = async () => {
        console.log('call')
            const database = new Database();
            this._topEmojis = [];
            try {
                let emojis = await database.getTopFavoriteEmoji(5);
                for (let emoji of emojis) {
                    this._topEmojis.push(<span>&nbsp;<span className="emoji-short" data-emoji={emoji.unicode} onClick={this.selectEmoji}>{emoji.unicode}</span></span>);
                }
            } catch (ex) {}
            if (this._topEmojis.length < 5) {
                for (let emoji of ['😊', '😂', '😍', '🤔', '😎', '👍️']) {
                    this._topEmojis.push(<span>&nbsp;<span className="emoji-short" data-emoji={emoji} onClick={this.selectEmoji}>{emoji}</span></span>);
                }
            }
            this.setState({reRender: Math.random()});
            this._topUpdater = setTimeout(updateTop, 5000);
        };

        this._topUpdater = setTimeout(updateTop, 100);
    }

    componentWillUnmount() {
        document.body.removeEventListener('click', this.onBodyClick);
        if (this._topUpdater) clearTimeout(this._topUpdater);
    }

    render() {
        return (
            <span>
                {this._topEmojis}
                &nbsp;
                <span className="emoji-picker-opener" onClick={this.toggle}>🔻</span>
                <div className="emoji-picker-tooltip" role="tooltip">
                </div>
            </span>
        );
    }
}
