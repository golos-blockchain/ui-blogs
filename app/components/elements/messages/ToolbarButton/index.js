import React from 'react';

import './ToolbarButton.css';

export default class ToolbarButton extends React.Component {
    render() {
        const { icon, onClick } = this.props;
        return (
            <i className={`toolbar-button ${icon}`} onClick={onClick || undefined} />
        );
    }
}
