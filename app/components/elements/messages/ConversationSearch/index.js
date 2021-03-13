import React from 'react';
import tt from 'counterpart';

import './ConversationSearch.css';

export default class ConversationSearch extends React.Component {
    render() {
        return (
            <div className='conversation-search'>
                <input
                    type='search'
                    className='conversation-search-input'
                    placeholder={tt('messages.search')}
                    onChange={this.props.onSearch}
                />
            </div>
        );
    }
}
