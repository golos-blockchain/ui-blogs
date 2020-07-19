import React, { Component } from 'react';

let WorkerRequests = null;

class WorkersLoader extends Component {
    componentDidMount() {
        if (!WorkerRequests && process.env.BROWSER) {
            require.ensure('./WorkerRequests', require => {
                WorkerRequests = require('./WorkerRequests').default;

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
        if (WorkerRequests) {
            return <WorkerRequests {...this.props} />;
        }

        return <div />;
    }
}

module.exports = {
    path: '/workers(/:state)(/@:username)(/:slug)',
    component: WorkersLoader,
};
