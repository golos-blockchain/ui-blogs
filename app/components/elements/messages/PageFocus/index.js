import React from 'react';

export default class PageFocus extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            focused: document.hasFocus(),
        };
    }

    componentDidMount() {
        document.addEventListener('focus', this.handleChange);
        document.addEventListener('blur', this.handleChange);
        if (typeof this.props.onChange === 'function') {
            // propagate change to callback
            this.props.onChange(document.hasFocus());
        }
    }

    componentWillUnmount() {
        document.removeEventListener('focus', this.handleChange);
        document.removeEventListener('blur', this.handleChange);
    }

    propagateChange = (focused) => {
        if (typeof this.props.onChange === 'function') {
            // propagate change to callback
            this.props.onChange(focused);
        }
        if (typeof this.props.children === 'function') {
            // we pass the props directly to the function as children
            this.setState({
                focused,
            });
        }
    };

    handleChange = (event) => {
        const focused = event.type === 'focus';
        this.propagateChange(focused);
    };

    render() {
        if (!this.props.children) {
            return null;
        }
        // function as children pattern support
        if (typeof this.props.children === 'function') {
            return this.props.children(this.state.focused);
        }

        return React.Children.only(this.props.children);
    }
}
