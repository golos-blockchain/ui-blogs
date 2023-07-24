import React from 'react';
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import {Set} from 'immutable'
import tt from 'counterpart'
import { Asset } from 'golos-lib-js/lib/utils'

import Comment from 'app/components/cards/Comment'
import PostFull from 'app/components/cards/PostFull'
import EncryptedStub from 'app/components/elements/EncryptedStub'
import Follow from 'app/components/elements/Follow'
import FoundationDropdownMenu from 'app/components/elements/FoundationDropdownMenu'
import Icon from 'app/components/elements/Icon'
import IllegalContentMessage from 'app/components/elements/IllegalContentMessage'
import LoadingIndicator from 'app/components/elements/LoadingIndicator';
import g from 'app/redux/GlobalReducer'
import user from 'app/redux/User'
import { authRegisterUrl, } from 'app/utils/AuthApiClient'
import { isBlocked } from 'app/utils/blacklist'
import { sortComments } from 'app/utils/comments'
import { hidePost } from 'app/utils/ContentAccess'
import { subscribePost, unsubscribePost, getSubs } from 'app/utils/NotifyApiClient'
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate'
import session from 'app/utils/session'
import { EncryptedStates } from 'app/utils/sponsors'
import { isHighlight, markCommentsRead, notifyPageView } from 'app/utils/NotifyApiClient'

class Post extends React.Component {
    static propTypes = {
        content: PropTypes.object.isRequired,
        post: PropTypes.string,
        aiPosts: PropTypes.array,
        routeParams: PropTypes.object,
        location: PropTypes.object,
        current_user: PropTypes.object,
    };

    constructor() {
        super();
        this.state = {
            showNegativeComments: false
        };
        this.shouldComponentUpdate = shouldComponentUpdate(this, 'Post')
        this.commentsRef = React.createRef()
    }

    async componentDidMount() {
        if (process.env.BROWSER) {
            const dis = this.getDiscussion()
            if (!dis) {
                return
            }

            const author = dis.get('author')
            const permlink = dis.get('permlink')

            const account = session.load().currentName
            if (account) {
                let found = false
                const res = await getSubs(account)
                if (res.result) {
                    for (const sub of res.result.subs) {
                        const [ subAuthor, subPermlink ] = sub.entityId.split('|')
                        if (subAuthor === author && subPermlink === permlink) {
                            found = true
                            break
                        }
                    }
                }
                this.setState({ subscribed: found })

                this.processHighlight()
            }

            try {
                notifyPageView(author, permlink)
            } catch (err) {}
        }
    }

    async componentDidUpdate() {
        this.processHighlight()
    }

    processHighlight() {
        const curUser = session.load().currentName
        if (!curUser) {
            return
        }
        const dis = this.getDiscussion()
        if (!dis) {
            return null
        }
        const replies = dis.get('replies').toJS()
        const loaded = replies.length || !dis.get('children')
        if (loaded) {
            const author = dis.get('author')
            const permlink = dis.get('permlink')

            const highlight = isHighlight()
            if (!this.state.highlight)
                this.setState({ highlight })

            if (highlight) {
                if (!dis.get('highlighted')) {
                    return null
                }
                markCommentsRead(curUser, author, permlink)
                this.props.markSubRead(author, permlink)
                this.readen = true
                let counter = 0
                const scroller = setInterval(() => {
                    let notYet = false
                    for (const img of document.getElementsByTagName('img')) {
                        if (!img.complete) {
                            notYet = true
                            break
                        }
                    }
                    ++counter
                    if ((notYet && counter < 2000) || !this.commentsRef.current) return

                    const proceed = () => {
                        clearInterval(scroller)
                        this.commentsRef.current.scrollIntoView()
                        document.scrollingElement.scrollTop -= 200
                    }
                    if (counter > 100) {
                        setTimeout(proceed, 500)
                    } else {
                        proceed()
                    }
                }, 1)
            }
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

    _renderStub = (children) => {
        return (<div className="Post">
            <div className="row">
                <div className="column">
                    <div className="PostFull">
                        {children}
                    </div>
                </div>
            </div>
        </div>)
    }

    _renderLoadingStub = () => {
        return this._renderStub(<LoadingIndicator type='circle' />)
    }

    _renderOnlyApp = () => {
        const openInstall = (e) => {
            e.preventDefault()
            window.open('/@lex/alternativnyi-klient-blogov-golos-desktop-izmeneniya-v-tredakh-kommentariev', '_blank')
        }
        return this._renderStub(
            <p>
                {tt('poststub.onlyapp')}
                <button className='button hollow tiny float-right'
                    onClick={openInstall}>
                    {tt('poststub.install')}</button>
            </p>
        )
    }

    _renderOnlyBlog = (dis) => {
        const { current_user, } = this.props
        if (!current_user) {
            return this._renderOnlyAuth(true)
        }
        const children = <p>
            {tt('poststub.onlyblog')}
            <Follow following={dis.get('root_author') || dis.get('author')} showMute={false} />
        </p>
        return this._renderStub(children)
    }

    _renderOnlyAuth = (onlyblog) => {
        const { showLogin } = this.props
        const children = <p>{onlyblog ? tt('poststub.onlyblog') : tt('poststub.foreignapp')}&nbsp;
            <a href='#' onClick={showLogin}>{tt('poststub.login')}</a>
            &nbsp;{tt('g.or')}&nbsp;
            <a href={authRegisterUrl()} target='_blank' rel='noreferrer noopener'>{tt('poststub.sign_up')}</a>.
        </p>
        return this._renderStub(children)
    }

    subscribe = async (e, dis) => {
        e.preventDefault()
        try {
            const { current_user, } = this.props
            const account = current_user && current_user.get('username')
            if (!account) return
            if (this.state.subscribed) {
                await unsubscribePost(account, dis.get('author'), dis.get('permlink'))
                this.setState({subscribed: false})
                return
            }
            await subscribePost(account, dis.get('author'), dis.get('permlink'))
            this.setState({subscribed: true})
        } catch (err) {
            alert(err.message || err)
        }
    }

    getDiscussion = (postGetter = () => {}) => {
        let { content, post, routeParams } = this.props
        if (!post) {
            post = routeParams.username + '/' + routeParams.slug
        }
        postGetter(post)
        const dis = content.get(post)
        return dis
    }

    render() {
        const {following, content, current_user} = this.props
        const {showNegativeComments, commentHidden, showAnyway} = this.state
        let { post } = this.props;
        const { aiPosts } = this.props;
        const dis = this.getDiscussion(p => post = p)

        if (!dis) return null;

        if (process.env.BROWSER) {
            const author = dis.get('author')
            const permlink = dis.get('permlink')
            const highlight = isHighlight()
            if (highlight && !dis.get('highlighted') && !this.readen) {
                return this._renderLoadingStub()
            }
        }

        const encrypted = dis.get('encrypted')
        if (encrypted === EncryptedStates.loading) {
            return this._renderLoadingStub(tt('poststub'))
        } else if (encrypted && encrypted !== EncryptedStates.decrypted) {
            return this._renderStub(<EncryptedStub dis={dis} encrypted={encrypted} />)
        }

        const stats = dis.get('stats').toJS()

        if(!showAnyway) {
            const {gray} = stats
            if(gray) {
                return this._renderStub(
                    <p onClick={current_user ? this.showAnywayClick : undefined}>{tt('promote_post_jsx.this_post_was_hidden_due_to_low_ratings')}.{' '}
                        {current_user ? 
                            <button style={{marginBottom: 0}} className="button hollow tiny float-right" onClick={this.showAnywayClick}>{tt('g.show')}</button>
                        : null}
                    </p>
                )
            }
        }

        let replies = dis.get('replies').toJS();

        let sort_order = this.state.highlight ? 'new' : 'trending';
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
            return !hide
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
                />)
            );

        const negativeGroup = commentHidden &&
            (<div className="hentry Comment root Comment__negative_group">
                <p>
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

        const hp = hidePost({
            dis,
            isOnlyapp: stats.isOnlyapp,
            isOnlyblog: stats.isOnlyblog,
            username: current_user && current_user.get('username'),
            following
        })
        if (hp === 'onlyapp') {
            return this._renderOnlyApp()
        } else if (hp === 'onlyblog') {
            return this._renderOnlyBlog(dis)
        } else if (hp === 'loading') {
            return this._renderLoadingStub()
        } else if (hp === 'onlyauth') {
            return this._renderOnlyAuth()
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

          if (isBlocked(post.split('/')[0], $STM_Config.blocked_users)) {
            return (<IllegalContentMessage />)
          }

          const { subscribed } = this.state
          
        return (
            <div className="Post">
                <div className="row">
                    <div className="column">
                        <PostFull post={post} cont={content} aiPosts={aiPosts} />
                    </div>
                </div>

                <div className="row hfeed">
                    {$STM_Config.show_adv_banners ?
                        (<iframe data-aa='1150095' src='//acceptable.a-ads.com/1150095' scrolling='no' style={{width:'100%', maxWidth:'50rem', margin:'0 auto', border:'0px', padding:'0', overflow:'hidden'}} allowtransparency='true' sandbox='allow-same-origin allow-scripts allow-popups' loading='lazy'></iframe>) : null}
                </div>
        
                <div id="comments" className="Post_comments row hfeed">
                    <div className="column large-12">
                        <div className="Post_comments__content" ref={this.commentsRef}>
                            {(!replies.length && dis.get('children')) ? (
                                <center>
                                    <LoadingIndicator type="circle" size="25px" />
                                </center>
                            ) : null}
                            <div className='Post__comments_subscribe float-left' title={subscribed ? tt('post_jsx.unsubscribe_long') : tt('post_jsx.subscribe_comments_long')} onClick={e => this.subscribe(e, dis)}>
                                {subscribed ? <Icon name='new/bellno' /> : <Icon name='new/bell' />}
                                <span>
                                    {subscribed ? tt('post_jsx.unsubscribe') : tt('post_jsx.subscribe_comments')}
                                </span>
                            </div>
                            <div className="Post__comments_sort_order float-right">
                                {tt('post_jsx.sort_order')}: &nbsp;
                                <FoundationDropdownMenu menu={sort_menu} label={sort_label} dropdownPosition="bottom" dropdownAlignment="right" />
                            </div>
                            {positiveComments}
                            {negativeGroup}
                            {(dis.get('children') > 10) && !subscribed && current_user ?
                            (<div className='Post__comments_subscribe golos-btn btn-secondary btn-round' align='center' onClick={e => this.subscribe(e, dis)}>
                                <Icon name='new/bell' />
                                <span>
                                    {subscribed ? tt('post_jsx.unsubscribe_long') : tt('post_jsx.subscribe_comments_long')}
                                </span>
                            </div>) : null}
                        </div>
                    </div>
                </div>

                {Math.random() > 0.5 ? 
                    <p align="center">
                        <a target="_blank" href="/@lex/alternativnyi-klient-blogov-golos-desktop-izmeneniya-v-tredakh-kommentariev">
                            <img src={require("app/assets/images/banners/desktop.png")} width="800" height="100" />
                        </a>
                        <span className="strike">
                            <a target="_blank" href="/@lex/alternativnyi-klient-blogov-golos-desktop-izmeneniya-v-tredakh-kommentariev">{tt('g.more_hint')}</a>
                        </span>
                    </p> : 
                    <p align="center">
                        <a target="_blank" href="https://dex.golos.app/#/trade/GOLOS_YMUSDT">
                            <img src={require("app/assets/images/banners/golosdex.png")} width="800" height="100" />
                        </a>
                        <span className="strike">
                            <a target="_blank" href="/@graphenelab/reliz-novoi-birzhi-golos">{tt('g.more_hint')}</a>
                        </span>
                    </p>}

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

    let following = null
    if (current_user) {
        const key = ['follow', 'getFollowingAsync', current_user.get('username'), 'blog_result']
        following = state.global.getIn(key, null)
    }

    return {
        content: state.global.get('content'),
        current_user,
        following,
    }
}, dispatch => ({
    showLogin: e => {
        if (e) e.preventDefault();
        dispatch(user.actions.showLogin())
    },
    markSubRead: (author, permlink) => {
        dispatch(g.actions.markSubRead({ author, permlink }))
    }
})
)(Post);
