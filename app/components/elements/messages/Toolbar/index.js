import React from 'react';

import './Toolbar.css';

export default function Toolbar(props) {
        const { title, leftItems, rightItems } = props;
        return (
            <div className='msgs-toolbar'>
                <div className='msgs-left-items'>{ leftItems }</div>
                <h1 className='msgs-toolbar-title'>{ title }</h1>
                <div className='msgs-right-items'>{ rightItems }</div>
            </div>
        );
}
