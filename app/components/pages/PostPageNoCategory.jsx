import React from 'react'
import { connect } from 'react-redux'

import LoadingIndicator from 'app/components/elements/LoadingIndicator'

class PostWrapper extends React.Component {
    constructor() {
        super();

        this.state = {
            loading: true,
        };
    }

    componentDidMount() {
        const { location, routeParams } = this.props
        const post = routeParams.username + '/' + routeParams.slug
        const dis = this.props.content.get(post)
        if (!dis) {
            this.props
                .getContent({
                    author: routeParams.username,
                    permlink: routeParams.slug,
                })
                .then(content => {
                    if (content) {
                        const redirect = `/${content.category}/@${post}` + location.search
                        window._NH.navigate(redirect, { replace: true })
                    }
                })
                .catch(() => {
                    this.setState({ loading: false })
                });
        } else if (dis.get('id') === '0.0.0') {
            // non-existing post
            this.setState({ loading: false })
        } else {
            const redirect = `/${dis.get('category')}/@${post}` + location.search
            window._NH.navigate(redirect, { replace: true })
        }
    }

    shouldComponentUpdate(np, ns) {
        return ns.loading !== this.state.loading
    }

    render() {
        return (
            <div>
                {this.state.loading ? (
                    <center>
                        <LoadingIndicator type="circle" />
                    </center>
                ) : (
                    <div className="NotFound float-center">
                        <a href="/">
                            <img src="/images/404.svg" width="640" height="480" />
                        </a>
                    </div>
                )}
            </div>
        )
    }
}

const StoreWrapped = connect(
    state => {
        return {
            content: state.global.get('content'),
        }
    },
    dispatch => ({
        getContent: payload =>
            new Promise((resolve, reject) => {
                dispatch({
                    type: 'GET_CONTENT',
                    payload: { ...payload, resolve, reject },
                });
            }),
    })
)(PostWrapper)

module.exports = {
    path: '/@:username/:slug',
    component: StoreWrapped,
}
