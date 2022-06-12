import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { Long } from 'bytebuffer';
import cn from 'classnames';
import tt from 'counterpart';
import { FormattedPlural } from 'react-intl';

import { sortComments } from 'app/utils/comments';
import user from 'app/redux/User';
import transaction from 'app/redux/Transaction';
import CommentFormLoader from 'app/components/modules/CommentForm/loader';
import MarkdownViewer from 'app/components/cards/MarkdownViewer';
import Author from 'app/components/elements/Author';
import Voting from 'app/components/elements/Voting';
import TimeVersions from 'app/components/elements/TimeVersions';
import Userpic from 'app/components/elements/Userpic';

class CommentImpl extends PureComponent {
    static propTypes = {
        // html props
        cont: PropTypes.object.isRequired,
        content: PropTypes.string.isRequired,
        sortOrder: PropTypes.oneOf(['votes', 'new', 'trending']).isRequired,
        root: PropTypes.bool,
        showNegativeComments: PropTypes.bool,
        onHide: PropTypes.func,

        // component props (for recursion)
        depth: PropTypes.number,

        // redux props
        username: PropTypes.string,
        rootComment: PropTypes.string,
        anchorLink: PropTypes.string.isRequired,
        deletePost: PropTypes.func.isRequired,
        ignoreList: PropTypes.any,
        negativeCommenters: PropTypes.any
    };

    static defaultProps = {
        depth: 1,
    };

    constructor(props) {
        super(props);

        this.state = {
            collapsed: false,
            depthCollapsed: true,
            hideBody: false,
            highlight: false,
        };
    }

    UNSAFE_componentWillMount() {
        const content = this.props.cont.get(this.props.content);

        if (content) {
            this._checkHide(content, this.props.negativeCommenters);
        }
    }

    componentDidMount() {
        // Jump to comment via hash (note: comment element's id has a hash(#) in it)
        if (window.location.hash === this.props.anchorLink) {
            const comment_el = document.getElementById(this.props.anchorLink);

            if (comment_el) {
                comment_el.scrollIntoView(true);
                document.body.scrollTop -= 200;
                this.setState({ highlight: true });
            }
        }
    }

    UNSAFE_componentWillReceiveProps(np) {
        const content = np.cont.get(np.content);

        if (content) {
            this._checkHide(content, np.negativeCommenters);
        }
    }

    /**
     * - `hide` is based on author reputation, and will hide the entire post on initial render.
     * - `hideBody` is true when comment rshares OR author rep is negative.
     *    it hides the comment body (but not the header) until the "reveal comment" link is clicked.
     */
    _checkHide(content, negativeCommenters) {
        let hide = hideSubtree(this.props.cont, this.props.content)

        if (content) {
            const comment = content.toJS()
            if (negativeCommenters.has(comment.author)) {
                hide = true
            }
        }


        if (hide) {
            const { onHide } = this.props;

            if (onHide) {
                onHide();
            }
        }

        this.setState({
            hide,
            hideBody: hide || content.getIn(['stats', 'gray']),
        });
    }

    render() {
        const { cont } = this.props;
        const dis = cont.get(this.props.content);

        if (!dis) {
            return <div>{tt('g.loading')}...</div>;
        }

        const comment = dis.toJS();

        if (!comment.stats) {
            console.error('Comment -- missing stats object');
            comment.stats = {};
        }

        const { authorRepLog10, pictures, gray } = comment.stats;
        const { json_metadata } = comment;
        const {
            depth,
            anchorLink,
            showNegativeComments,
            ignoreList,
            negativeCommenters,
            sortOrder,
            username,
            blocked
        } = this.props;

        const post = comment.author + '/' + comment.permlink;
        const { showReply, showEdit, hide, hideBody } = this.state;

        const ignore = ignoreList && ignoreList.has(comment.author);

        if (!showNegativeComments && (hide || ignore)) {
            return null;
        }

        let jsonMetadata = null;

        if (!showReply) {
            try {
                jsonMetadata = JSON.parse(json_metadata);
            } catch (error) {}
        }

        let replies = null;
        let body = null;
        let controls = null;

        if ($STM_Config.blocked_users.includes(comment.author)) {
            return null;
        } else if (!this.state.collapsed && !hideBody) {
            body = (
                <MarkdownViewer
                    formId={post + '-viewer'}
                    text={comment.body}
                    noImage={!pictures}
                    jsonMetadata={jsonMetadata}
                />
            );

            controls = this._renderControls(post, comment);
        }

        if (!this.state.collapsed && comment.children > 0) {
            if ((depth > 0 && depth % 8 === 0) && this.state.depthCollapsed) {
                const comment_permlink = `/${comment.category}/@${
                    comment.author
                }/${comment.permlink}`;

                const repliesFew = tt('comment_jsx.show_N_more_replies_2', { N: comment.children })
                const repliesMany = tt('comment_jsx.show_N_more_replies', { N: comment.children })

                replies = (
                    <Link to={comment_permlink} onClick={this.showMoreReplies}>
                        <FormattedPlural value={comment.children}
                            one={tt('comment_jsx.show_1_more_reply')}
                            few={repliesFew}
                            many={repliesMany}
                            other={repliesMany}
                        />
                    </Link>
                );
            } else {
                replies = comment.replies;
                sortComments(cont, replies, sortOrder);
                // When a comment has hidden replies and is collapsed, the reply count is off
                replies = replies.map((reply, idx) => (
                    <Comment
                        key={idx}
                        content={reply}
                        cont={cont}
                        sortOrder={sortOrder}
                        depth={depth + 1}
                        rootComment={this._getRootComment(comment)}
                        showNegativeComments={showNegativeComments}
                        onHide={this.props.onHide}
                        ignoreList={ignoreList}
                        negativeCommenters={negativeCommenters}
                    />
                ));
            }
        }

        let renderedEditor = null;
        if (showReply || showEdit) {
            renderedEditor = (
                <CommentFormLoader
                    reply={showReply}
                    editMode={showEdit}
                    params={comment}
                    jsonMetadata={jsonMetadata}
                    onSuccess={this._onSuccess}
                    onCancel={this._onCancel}
                />
            );
        }

        if (negativeCommenters && negativeCommenters.has(username)) {
            renderedEditor = <h5 className="error">{tt('g.blocked_from_blog')}</h5>
        }

        return (
            <div
                className={cn(
                    'hentry Comment',
                    this.props.root ? 'root' : 'reply',
                    {
                        collapsed: hideBody || this.state.collapsed,
                    }
                )}
                id={anchorLink}
                itemScope
                itemType="http://schema.org/comment"
            >
                {this._renderDepthIndicator()}
                <div className="Comment__Userpic show-for-medium">
                    <Userpic account={comment.author} reputation={authorRepLog10} />
                </div>
                <div
                    className={cn({
                        downvoted: ignore || gray || blocked,
                        highlighted: this.state.highlight,
                    })}
                >
                    <div className="Comment__header">
                        <div className="Comment__header_collapse">
                            <a
                                title={tt('comment_jsx.collapse_or_expand')}
                                onClick={this.toggleCollapsed}
                            >
                                {this.state.collapsed ? '[+]' : '[-]'}
                            </a>
                        </div>
                        <span className="Comment__header-user">
                            <div className="Comment__Userpic-small">
                                <Userpic account={comment.author} />
                            </div>
                            <Author
                                author={comment.author}
                                authorRepLog10={authorRepLog10}
                            />
                        </span>
                        &nbsp; &middot; &nbsp;
                        <Link
                            to={this._getCommentLink(comment)}
                            className="PlainLink"
                        >
                            <TimeVersions
                                content={comment}
                            />
                        </Link>
                        {this.state.collapsed || hideBody ? (
                            <Voting post={post} showList={false} />
                        ) : null}
                        {this.state.collapsed && comment.children > 0 ? (
                            <span className="marginLeft1rem">
                                {tt('plurals.reply_count', {
                                    count: comment.children,
                                })}
                            </span>
                        ) : null}
                        {!this.state.collapsed && hideBody ? (
                            <a
                                className="marginLeft1rem"
                                onClick={this.revealBody}
                            >
                                {tt('comment_jsx.reveal_comment')}
                            </a>
                        ) : null}
                    </div>
                    <div className="Comment__body entry-content">
                        {showEdit ? renderedEditor : body}
                    </div>
                    <div className="Comment__footer">{controls}</div>
                </div>
                <div className="Comment__replies hfeed">
                    {showReply && renderedEditor}
                    {replies}
                </div>
            </div>
        );
    }

    _renderControls(post, comment) {
        let controls = null;

            const { author, stats } = comment;
            const { username } = this.props;

            const isPaidOut = comment.cashout_time === '1969-12-31T23:59:59';

            const showDonate = username && username !== author;
            const showEdit = username === author;
            const showReply = comment.depth < 255;
            const showDelete =
                username === author && stats.allowDelete && !isPaidOut;

            controls = (
                <span className="Comment__footer__controls">
                    {showReply && (
                        <a onClick={this.onShowReply}>{tt('g.reply')}</a>
                    )}{' '}
                    {showEdit && (
                        <a onClick={this.onShowEdit}>{tt('g.edit')}</a>
                    )}{' '}
                    {showDelete && (
                        <a onClick={this.onDeletePost}>{tt('g.delete')}</a>
                    )}
                </span>
            );

        return (
            <div>
                <Voting post={post} />
                {controls}
            </div>
        );
    }

    _renderDepthIndicator() {
        const { depth } = this.props;

        if (depth > 1) {
            const dots = [];

            for (let i = 1; i < depth; ++i) {
                dots.push(
                    <div key={i} className={`depth di-${i}`}>
                        &middot;
                    </div>
                );
            }

            return dots;
        }
    }

    onShowReply = () => {
        this.setState({ showReply: !this.state.showReply, showEdit: false });
    };

    onShowEdit = () => {
        this.setState({ showEdit: !this.state.showEdit, showReply: false });
    };

    onDeletePost = () => {
        const content = this.props.cont.get(this.props.content);

        this.props.deletePost(content.get('author'), content.get('permlink'));
    };

    toggleCollapsed = () => {
        this.setState({ collapsed: !this.state.collapsed });
    };

    showMoreReplies = (e) => {
        e.preventDefault()
        this.setState({ depthCollapsed: false })
    }

    revealBody = () => {
        this.setState({ hideBody: false });
    };

    _onSuccess = () => {
        this.setState({ showReply: false, showEdit: false });
    };

    _onCancel = () => {
        this.setState({ showReply: false, showEdit: false });
    };

    _getRootComment(comment) {
        let { rootComment } = this.props;

        if (!rootComment && this.props.depth === 1) {
            rootComment = comment.parent_author + '/' + comment.parent_permlink;
        }

        return rootComment;
    }

    _getCommentLink(comment) {
        const rootComment = this._getRootComment(comment);

        return `/${comment.category}/@${rootComment}#@${comment.author}/${
            comment.permlink
        }`;
    }
}

const Comment = connect(
    (state, props) => {
        const { cont, content, negativeCommenters } = props;

        const username = state.user.getIn(['current', 'username']);
        const dis = cont.get(content);
        let blocked = false

        if (dis) {
            const comment = dis.toJS()
            blocked = negativeCommenters.has(comment.author)
        }

        return {
            ...props,
            blocked,
            // Using a hash here is not standard but intentional; see issue #124 for details
            anchorLink: '#@' + content,
            username,
        };
    },
    dispatch => ({
        unlock: () => user.actions.showLogin(),
        deletePost: (author, permlink) =>
            dispatch(
                transaction.actions.broadcastOperation({
                    type: 'delete_comment',
                    operation: { author, permlink },
                    confirm: tt('g.are_you_sure'),
                })
            ),
    })
)(CommentImpl);

// returns true if the comment has a 'hide' flag AND has no descendants w/ positive payout
function hideSubtree(cont, c) {
    return cont.getIn([c, 'stats', 'hide']) && !hasPositivePayout(cont, c);
}

function hasPositivePayout(cont, c) {
    const post = cont.get(c);

    return (
        post.getIn(['stats', 'hasPendingPayout']) ||
        post.get('replies').find(reply => hasPositivePayout(cont, reply))
    );
}

export default Comment;
