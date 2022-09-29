import React from 'react';
import PropTypes from 'prop-types'
import { Link } from 'react-router';
import { connect } from 'react-redux';
import Icon from 'app/components/elements/Icon';
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate'
import tt from 'counterpart';

class VotesAndComments extends React.Component {

    static propTypes = {
        // HTML properties
        post: PropTypes.string.isRequired,
        commentsLink: PropTypes.string.isRequired,
        isForum: PropTypes.bool,
        fromSearch: PropTypes.bool,

        // Redux connect properties
        votes: PropTypes.number,
        comments: PropTypes.number,
    };

    constructor(props) {
        super(props);
        this.shouldComponentUpdate = shouldComponentUpdate(this, 'VotesAndComments');
    }

    onClick = (event) => {
        const { isForum, fromSearch, commentsLink } = this.props;
        if (isForum || fromSearch) {
            event.preventDefault();
            window.open(commentsLink, '_blank');
        }
    };

    render() {
        const {votes, comments, commentsLink} = this.props;
        let comments_tooltip = tt('votesandcomments_jsx.no_responses_yet_click_to_respond');
        if (comments > 0) comments_tooltip = `${tt('votesandcomments_jsx.response_count', {count: comments})}. ${tt('votesandcomments_jsx.click_to_respond')}.`

        return (
            <span className="VotesAndComments">
                <span className={'VotesAndComments__comments' + (comments === 0 ? ' no-comments' : '')}>
                     <Link to={commentsLink} onClick={this.onClick} title={comments_tooltip}>
                        <Icon name={comments > 1 ? 'chatboxes' : 'chatbox'} />&nbsp;{comments}
                     </Link>
                 </span>
            </span>
        );
    }
}

export default connect(
    (state, props) => {
        const post = state.global.getIn(['content', props.post]);
        if (!post) return props;
        return {
            ...props,
            votes: post.get('net_votes'),
            comments: post.get('children')
        };
    }
)(VotesAndComments);
