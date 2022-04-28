import React from 'react';
import PropTypes from 'prop-types'
import Comment from 'app/components/cards/Comment';
import PostFull from 'app/components/cards/PostFull';
import {connect} from 'react-redux';
import {sortComments} from 'app/utils/comments';
import LoadingIndicator from 'app/components/elements/LoadingIndicator';
import FoundationDropdownMenu from 'app/components/elements/FoundationDropdownMenu';
import IllegalContentMessage from 'app/components/elements/IllegalContentMessage';
import {Set} from 'immutable'
import tt from 'counterpart';
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate';

class Post extends React.Component {
    static propTypes = {
        content: PropTypes.object.isRequired,
        post: PropTypes.string,
        aiPosts: PropTypes.array,
        routeParams: PropTypes.object,
        location: PropTypes.object,
        current_user: PropTypes.object,
        negativeCommenters: PropTypes.any,
    };

    constructor() {
        super();
        this.state = {
            showNegativeComments: false
        };
        this.shouldComponentUpdate = shouldComponentUpdate(this, 'Post')
    }

    componentDidMount() {
        if (window.location.hash.indexOf('comments') !== -1) {
            const comments_el = document.getElementById('comments');
            if (comments_el) comments_el.scrollIntoView();
        }
    }

    toggleNegativeReplies = (e) => {
        this.setState({
            showNegativeComments: !this.state.showNegativeComments
        });
        e.preventDefault();
    };

    onHideComment = () => {
        this.setState({commentHidden: true})
    }

    showAnywayClick = () => {
        this.setState({showAnyway: true})
    }

    render() {
        const {ignoring, content, negativeCommenters, current_user} = this.props
        const {showNegativeComments, commentHidden, showAnyway} = this.state
        let { post } = this.props;
        const { aiPosts } = this.props;
        if (!post) {
            const route_params = this.props.routeParams;
            post = route_params.username + '/' + route_params.slug;
        }
        const dis = content.get(post);

        if (!dis) return null;

        const stats = dis.get('stats').toJS()

        if(!showAnyway) {
            const {gray} = stats
            if(gray) {
                return (
                    <div className="Post">
                        <div className="row">
                            <div className="column">
                                <div className="PostFull">
                                    <p onClick={current_user ? this.showAnywayClick : undefined}>{tt('promote_post_jsx.this_post_was_hidden_due_to_low_ratings')}.{' '}
                                        {current_user ? 
                                            <button style={{marginBottom: 0}} className="button hollow tiny float-right" onClick={this.showAnywayClick}>{tt('g.show')}</button>
                                        : null}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                    </div>
                )
            }
        }

        let replies = dis.get('replies').toJS();

        let sort_order = 'trending';
        if( this.props.location && this.props.location.query.sort )
           sort_order = this.props.location.query.sort;

        const commentLimit = 100;
        if (global['process'] !== undefined && replies.length > commentLimit) {
            console.log(`Too many comments, ${replies.length - commentLimit} omitted.`);
            replies = replies.slice(0, commentLimit);
        }

        sortComments( content, replies, sort_order );
        const keep = a => {
            const c = content.get(a);
            const hide = c.getIn(['stats', 'hide'])
            let ignore = false
            if(ignoring) {
                ignore = ignoring.has(c.get('author'))
                // if(ignore) console.log(current_user && current_user.get('username'), 'is ignoring post author', c.get('author'), '\t', a)
            }
            return !hide && !ignore
        }
        const positiveComments = replies.filter(a => keep(a))
            .map(reply => (
                <Comment
                    root
                    key={post + reply}
                    content={reply}
                    cont={content}
                    sortOrder={sort_order}
                    showNegativeComments={showNegativeComments}
                    onHide={this.onHideComment}
                    ignoreList={ignoring}
                    negativeCommenters={negativeCommenters}
                />)
            );

        const negativeGroup = commentHidden &&
            (<div className="hentry Comment root Comment__negative_group">
                <br /><p>
                    {tt(showNegativeComments ? 'post_jsx.now_showing_comments_with_low_ratings' : 'post_jsx.comments_were_hidden_due_to_low_ratings')}.{' '}
                    {(current_user || showNegativeComments) ? <button className="button hollow tiny float-right" onClick={e => this.toggleNegativeReplies(e)}>
                        {tt(showNegativeComments ? 'g.hide' :'g.show')}
                    </button> : null}
                </p>
            </div>);


        let sort_orders = [ 'trending', 'votes', 'new', 'old'];
        let sort_labels = [ tt('main_menu.trending'), tt('g.votes'), tt('g.created'), tt('g.old') ];
        let sort_menu = [];
        let sort_label;

        let selflink = `/${dis.get('category')}/@${post}`;
        for( let o = 0; o < sort_orders.length; ++o ){
            if(sort_orders[o] == sort_order) sort_label = sort_labels[o];
            sort_menu.push({
                value: sort_orders[o],
                label: sort_labels[o],
                link: selflink + '?sort=' + sort_orders[o] + '#comments'
            });
        }
        let emptyPost = dis.get('created') === '1970-01-01T00:00:00' && dis.get('body') === ''
        if (stats.isOnlyapp && !process.env.IS_APP) {
            if (!current_user || current_user.get('username') !== dis.get('author')) {
                emptyPost = true
            }
        }
        if(emptyPost)
            return <center>
                <div className="NotFound float-center">
                    <div>
                        <h4 className="NotFound__header">Sorry! This page doesnt exist.</h4>
                        <p>Not to worry. You can head back to <a style={{fontWeight: 800}} href="/">our homepage</a>,
                            or check out some great posts.
                        </p>
                        <ul className="NotFound__menu">
                            <li><a href="/trending">trending posts</a></li>
                            <li><a href="/created">new posts</a></li>
                            <li><a href="/responses">discussed posts</a></li>
                            <li><a href="/forums">forums posts</a></li>
                        </ul>
                    </div>
                </div>
            </center>

          if($STM_Config.blocked_users.includes(post.split("/")[0])) {
            return (<IllegalContentMessage />)
          }
          
        return (
            <div className="Post">
                <div className="row">
                    <div className="column">
                        <PostFull post={post} cont={content} aiPosts={aiPosts} />
                    </div>
                </div>

                <div className="row hfeed">
                    {$STM_Config.show_adv_banners ?
                    (<iframe data-aa='1150095' src='//acceptable.a-ads.com/1150095' scrolling='no'
                    style={{width:'100%', maxWidth:'50rem', margin:'0 auto', border:'0px', padding:'0', overflow:'hidden'}}
                    allowtransparency='true' sandbox='allow-same-origin allow-scripts allow-popups' loading='lazy'></iframe>) : null}
                </div>
        
                <div id="comments" className="Post_comments row hfeed">
                    <div className="column large-12">
                        <div className="Post_comments__content">
                            {(!replies.length && dis.get('children')) ? (
                                <center>
                                    <LoadingIndicator type="circle" size="25px" />
                                </center>
                            ) : null}
                            {positiveComments.length ?
                            (<div className="Post__comments_sort_order float-right">
                                {tt('post_jsx.sort_order')}: &nbsp;
                                <FoundationDropdownMenu menu={sort_menu} label={sort_label} dropdownPosition="bottom" dropdownAlignment="right" />
                            </div>) : null}
                            {positiveComments}
                            {negativeGroup}
                        </div>
                    </div>
                </div>

                <p align="center">
                	{/*<a target="_blank" href="https://dex.golos.app"><img src={require("app/assets/images/banners/golosdex.png")} width="800" height="100" /></a>
                    <span className="strike"><a target="_blank" href="/@graphenelab/reliz-novoi-birzhi-golos">{tt('g.more_hint')}</a></span>*/}

                    <a target="_blank" href="/@lex/alternativnyi-klient-blogov-golos-desktop-izmeneniya-v-tredakh-kommentariev"><img src={require("app/assets/images/banners/desktop.png")} width="800" height="100" /></a>
                    <span className="strike"><a target="_blank" href="/@lex/alternativnyi-klient-blogov-golos-desktop-izmeneniya-v-tredakh-kommentariev">{tt('g.more_hint')}</a></span>
                </p>

            </div>
        );
    }
}

const emptySet = Set()

export default connect((state, props) => {
    const current_user = state.user.get('current')

    let { post } = props;
    if (!post) {
        const route_params = props.routeParams;
        post = route_params.username + '/' + route_params.slug;
    }
    const dis = state.global.get('content').get(post);

    let ignoring = new Set()
    let negativeCommenters = new Set()

    if (dis && state.global.get('follow')) {
        const key = ['follow', 'getFollowingAsync', dis.get('author'), 'ignore_result']
        negativeCommenters = state.global.getIn(key, emptySet)
    }

    if (current_user) {
        const key = ['follow', 'getFollowingAsync', current_user.get('username'), 'ignore_result']
        ignoring = state.global.getIn(key, emptySet)
    }

    return {
        content: state.global.get('content'),
        current_user,
        ignoring,
        negativeCommenters
    }
}
)(Post);
