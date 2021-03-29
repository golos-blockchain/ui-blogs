import React from 'react';
import Icon from 'app/components/elements/Icon';

import './ToolbarButton.css';

export default class ToolbarButton extends React.Component {
    render() {
        const { icon, className, onClick } = this.props;
        return (
            <i className={`msgs-toolbar-button ` + (className || '')} onClick={onClick || undefined}>
                <Icon name={`ionicons/${icon}`} size='1_75x' className='msgs-icon' />
            </i>
        );
    }
}
