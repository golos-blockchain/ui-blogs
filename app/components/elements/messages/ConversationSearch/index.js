import React from 'react';
import tt from 'counterpart';
import Icon from 'app/components/elements/Icon';

import './ConversationSearch.css';

export default class ConversationSearch extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            query: '',
        };
    }

    search = (value, event) => {
        this.setState({
            query: value,
        });
        this.props.onSearch(value, event);
    };

    onChange = (event) => {
        this.search(event.target.value, event);
    };

    clear = (event) => {
        this.search('', event);
    };

    render() {
        return (
            <div className='conversation-search'>
                <input
                    type='search'
                    className='conversation-search-input'
                    placeholder={tt('messages.search')}
                    value={this.state.query}
                    onChange={this.onChange}
                />
                {this.state.query ? <div className='conversation-search-buttons'
                    onClick={this.clear}>
                    <Icon name={`cross`} size='0_75x' />
                </div> : null}
            </div>
        );
    }
}
