import React, { Component, } from 'react';
import Icon from 'app/components/elements/Icon';

class Expandable extends Component {
    state = {
        opened: false,
    };

    onToggleExpander = () => {
        this.setState({
            opened: !this.state.opened,
        })
    };

    render() {
        const { title, } = this.props;
        const { opened, } = this.state;
        return (<div className={'Expandable' + (opened ? ' opened' : '')}>
            <div className='Expander' onClick={this.onToggleExpander}>
                <Icon name={opened ? 'chevron-up-circle' : 'chevron-down-circle'} size='2x' />
                <h5 style={{ paddingLeft: '0.5rem', }}>{title}</h5>
            </div>
            <div className='Expandable__content'>
                {this.props.children}
            </div>
        </div>);
    }
}

export default Expandable;
