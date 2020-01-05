import React, { Component } from 'react';

let Nodes = null;

class NodesLoader extends Component {
    componentDidMount() {
        if (!Nodes && process.env.BROWSER) {
            require.ensure('./Nodes', require => {
                Nodes = require('./Nodes').default;

                if (!this._unmount) {
                    this.forceUpdate();
                }
            });
        }
    }

    componentWillUnmount() {
        this._unmount = true;
    }

    render() {
        if (Nodes) {
            return <Nodes {...this.props} />;
        }

        return <div />;
    }
}

module.exports = {
    path: '/nodes',
    component: NodesLoader,
};
