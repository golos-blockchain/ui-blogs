import React from 'react';

import ReplyEditor from 'app/components/elements/ReplyEditor';
import PostFormLoader from 'app/components/modules/PostForm/loader'
import { VISIBLE_TYPES } from 'app/components/modules/PostForm/PostForm'
import { withRouter } from 'app/utils/routing';

class SubmitPost extends React.PureComponent {
    constructor(props) {
        super(props);

        this.SubmitReplyEditor = ReplyEditor('submitStory');
    }

    UNSAFE_componentWillMount() {
        document.body.classList.add('submit-page');
    }

    componentWillUnmount() {
        document.body.classList.remove('submit-page');
    }

    render() {
        const { query } = this.props.location;

        /*if (window.IS_MOBILE) {
            return (
                <div className="SubmitPost">
                    <this.SubmitReplyEditor
                        type={query.type || 'submit_story'}
                        successCallback={this._onSuccess}
                    />
                </div>
            );
        } else */{
            return <PostFormLoader onSuccess={this._onSuccess} />;
        }
    }

    _onSuccess = (payload, editMode, visibleType) => {
        const { router } = this.props;
        if (visibleType !== VISIBLE_TYPES.ALL) {
            setTimeout(() => {
                router.navigate('/@' + payload.author)
            }, 1000)
            return
        }
        router.navigate('/created')
    };
}

module.exports = {
    path: '/submit',
    component: withRouter(SubmitPost),
};
