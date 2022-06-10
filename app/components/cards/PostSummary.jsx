import React from 'react';
import PropTypes from 'prop-types'
import { Link } from 'react-router';
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper';
import Icon from 'app/components/elements/Icon';
import { connect } from 'react-redux';
import transaction from 'app/redux/Transaction';
import user from 'app/redux/User';
import Reblog from 'app/components/elements/Reblog';
import MuteAuthorInNew from 'app/components/elements/MuteAuthorInNew';
import PinPost from 'app/components/elements/PinPost';
import Voting from 'app/components/elements/Voting';
import {immutableAccessor} from 'app/utils/Accessors';
import extractContent from 'app/utils/ExtractContent';
import { browserHistory } from 'react-router';
import VotesAndComments from 'app/components/elements/VotesAndComments';
import TagList from 'app/components/elements/TagList';
import {authorNameAndRep} from 'app/utils/ComponentFormatters';
import {Map} from 'immutable';
import Author from 'app/components/elements/Author';
import UserNames from 'app/components/elements/UserNames';
import tt from 'counterpart';
import { CHANGE_IMAGE_PROXY_TO_STEEMIT_TIME } from 'app/client_config';
import { detransliterate } from 'app/utils/ParsersAndFormatters';
import { proxifyImageUrl } from 'app/utils/ProxifyUrl';
import PostSummaryThumb from 'app/components/elements/PostSummaryThumb'

function isLeftClickEvent(event) {
    return event.button === 0
}

function isModifiedEvent(event) {
    return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
}

function navigate(e, onClick, post, url, isForum, isSearch) {
    if (isForum || isSearch)
        return;
    if (isModifiedEvent(e) || !isLeftClickEvent(e)) return;
    e.preventDefault();
    if (onClick) onClick(post, url);
    else browserHistory.push(url);
}

class PostSummary extends React.Component {
    static propTypes = {
        post: PropTypes.string.isRequired,
        pending_payout: PropTypes.string.isRequired,
        total_payout: PropTypes.string.isRequired,
        content: PropTypes.object.isRequired,
        currentCategory: PropTypes.string,
        thumbSize: PropTypes.string,
        nsfwPref: PropTypes.string,
        onClick: PropTypes.func,
        visited: PropTypes.bool,
        blockEye: PropTypes.bool
    };

    constructor() {
        super();
        this.state = {revealNsfw: false}
        this.onRevealNsfw = this.onRevealNsfw.bind(this)
    }

    shouldComponentUpdate(props, state) {
        return props.thumbSize !== this.props.thumbSize ||
               props.pending_payout !== this.props.pending_payout ||
               props.total_payout !== this.props.total_payout ||
               props.username !== this.props.username ||
               props.nsfwPref !== this.props.nsfwPref ||
               state.revealNsfw !== this.state.revealNsfw ||
               props.visited !== this.props.visited ||
               props.gray !== this.props.gray ||
               props.hide !== this.props.hide
    }

    onRevealNsfw(e) {
        e.preventDefault();
        this.setState({revealNsfw: true})
    }

    onDeleteReblog = (account, post) => {
        this.props.deleteReblog(account, post.get('author'), post.get('permlink'),
            () => {
                window.location.reload()
            }, (err) => {
            })
    }

    render() {
        const {currentCategory, thumbSize, ignore, onClick} = this.props;
        const {post, content, pending_payout, total_payout, cashout_time, blockEye} = this.props;
        const {account} = this.props;
        const {nsfwPref, username} = this.props
        if (!content) return null;

        const myPost = username === content.get('author')

        if ($STM_Config.blocked_users.includes(content.get('author'))) {
			return null;
		}

        let reblogged_by;
        if(content.get('reblogged_by') && content.get('reblogged_by').size > 0) {
            reblogged_by = content.get('reblogged_by').toJS()
        } else if(content.get('first_reblogged_by')) {
            // TODO: this case is backwards-compat for 0.16.1. remove after upgrading.
            reblogged_by = [content.get('first_reblogged_by')]
        }

        if(reblogged_by) {
          reblogged_by = <div className="PostSummary__reblogged_by">
                             <Icon name="reblog" /> {tt('postsummary_jsx.resteemed_by')} <UserNames names={reblogged_by} />
                         </div>
        }

        const myAccount = account === username

        if(account && account != content.get('author')) {
          reblogged_by = <div className="PostSummary__reblogged_by">
                             <Icon name="reblog" /> {tt('postsummary_jsx.resteemed')}
                             {myAccount ? <Icon
                                className="PostSummary__delete_reblog"
                                name="cross"
                                size="0_75x"
                                title={tt('g.delete')}
                                onClick={() => this.onDeleteReblog(account, content)}
                                /> : null}
                         </div>
        }

        const {gray, pictures, authorRepLog10, flagWeight, isNsfw, isOnlyblog, isOnlyapp} = content.get('stats', Map()).toJS()

        if ((isOnlyblog || (isOnlyapp && !process.env.IS_APP)) && !username) {
            return null
        }

        const p = extractContent(immutableAccessor, content);
        const nsfwTags = ['nsfw', 'ru--mat', '18+']
        let nsfwTitle = nsfwTags[0]
        let currentNsfw = []
        if (isNsfw && p.json_metadata && p.json_metadata.tags)
            currentNsfw = p.json_metadata.tags.filter(function(n) { return nsfwTags.indexOf(n) >= 0 })
        if (currentNsfw && currentNsfw.length)
            nsfwTitle = currentNsfw[0]
        let desc = p.desc
        if(p.image_link)// image link is already shown in the preview
            desc = desc.replace(p.image_link, '')
        let title_link_url;
        let is_forum = false;
        let title_text = p.title;
        let comments_link;
        let is_comment = false;
        const promoted_post = content.get('promoted') >= '1.000 GBG';

        if( content.get( 'parent_author') !== "" ) {
           title_text = tt('g.re') + ": " + content.get('root_title');
           title_link_url = content.get( 'url' );
           comments_link = title_link_url;
           is_comment = true;
        } else {
           title_link_url = p.link;
           comments_link = p.link + '#comments';
        }

        if (title_link_url.includes('fm-') && $STM_Config.forums) {
            let parts = title_link_url.split('/');
            for (let [_id, forum] of Object.entries($STM_Config.forums)) {
                if (!forum || !forum.domain)
                    continue;
                if (parts[1].startsWith(_id)) {
                    is_forum = true;
                    parts[0] = forum.domain;
                    parts[1] = parts[1].replace(_id + '-', '');
                    title_link_url = 'http://' + parts.join('/');

                    const last_reply = content.get('last_reply');
                    if (last_reply) {
                        title_link_url += '#@' + last_reply.get('author') + '/' + last_reply.get('permlink');
                    }

                    comments_link = title_link_url;
                    break;
                }
            }
        }

        let from_search = content.get('from_search')

        if (username && !is_forum)
            title_link_url += "?invite=" + username;

        const link_target = (is_forum || from_search) ? '_blank' : undefined;

        let content_body = <div className="PostSummary__body entry-content">
            <a href={title_link_url} target={link_target} onClick={e => navigate(e, onClick, post, title_link_url, is_forum, from_search)}>{desc}</a>
        </div>;

        const warn = (isNsfw && nsfwPref === 'warn' && !myPost);
        const promosumm = tt('g.promoted_post') + content.get('promoted');

        let worker_post = content.get('has_worker_request')
        if (worker_post) {
            worker_post = '/workers/created/@' + content.get('author') + '/' + content.get('permlink')
        }

        let total_search = content.get('total_search')

        let content_title = <h3 className="entry-title">
            <a href={title_link_url} target={link_target} onClick={e => navigate(e, onClick, post, title_link_url, is_forum, from_search)}>
                {title_text}
            </a>
            {isOnlyblog && <span className="nsfw_post" title={tt('post_editor.onlyblog_hint')}>{tt('g.for_followers')}</span>}
            {isOnlyapp && <span className="nsfw_post" title={tt('post_editor.visible_option_onlyapp_hint')}>{tt('g.only_app')}</span>}
            {warn && <span className="nsfw_post" title={tt('post_editor.nsfw_hint')}>{detransliterate(nsfwTitle)}</span>}
            {worker_post && <a target="_blank" href={worker_post}><span className="worker_post">{tt('workers.worker_post')}</span></a>}
            {promoted_post && <a target="_blank" href="https://wiki.golos.id/users/welcome#prodvinut-post"><span className="promoted_post" title={promosumm}>{tt('g.promoted_title')}</span></a>}
        </h3>;

        // author and category
        let author_category = <span className="vcard">
            <a href={title_link_url} target={link_target} onClick={e => navigate(e, onClick, post, title_link_url, is_forum, from_search)}><TimeAgoWrapper date={is_forum ? p.active : p.created} className="updated" /></a>
            {' '}
            {blockEye && <MuteAuthorInNew author={p.author} />}
            <Author author={p.author} authorRepLog10={authorRepLog10} follow={false} mute={false} />
            {} {tt('g.in')} <TagList post={p} single />
        </span>

        const content_footer = <div className="PostSummary__footer">
            <Voting post={post} showList={false} />
            <VotesAndComments post={post} commentsLink={comments_link} isForum={is_forum} fromSearch={from_search} />
            <span className="PostSummary__time_author_category">
            
            <PinPost author={p.author} permlink={p.permlink} />

            {!p.parent_author && <Reblog author={p.author} permlink={p.permlink} />}
                <span className="show-for-medium">
                    {author_category}
                </span>
            </span>
        </div>

        if(isNsfw) {
            if(nsfwPref === 'hide' && !myPost) {
                // user wishes to hide these posts entirely
                return null;
            }
        }

        const visitedClassName = this.props.visited ? 'PostSummary__post-visited ' : '';
        let thumb = null;
        if(pictures && p.image_link) {
          const size = (thumbSize == 'mobile') ? '800x600' : '256x512'

          let url = proxifyImageUrl('', size);
          if (Date.parse(p.created) > CHANGE_IMAGE_PROXY_TO_STEEMIT_TIME) {
            url += p.image_link
          } else {
            url += p.image_link
          }

          thumb = <PostSummaryThumb
              visitedClassName={visitedClassName}
              mobile={thumbSize == 'mobile'}
              isNsfw={warn}
              src={url}
              href={title_link_url}
              target={link_target}
              onClick={e => navigate(e, onClick, post, title_link_url, is_forum, from_search)} />
        }
        const commentClasses = []
        if(gray || ignore) commentClasses.push('downvoted') // rephide

        total_search = total_search ? <span class="strike" style={{ fontSize: '1rem', paddingBottom: '1rem' }}>
                {tt('g.and_more_search_posts_COUNT', { COUNT: total_search })}
                <a target="_blank" href="/search"><img className="float-center" src={require("app/assets/images/search.png")} width="400" /></a>
            </span> : null

        if (content.get('force_hide')) {
            return total_search
        }

        return (
            <article className={'PostSummary hentry' + (thumb ? ' with-image ' : ' ') + (worker_post ? ' blue-bg ' : ' ') + commentClasses.join(' ')} itemScope itemType ="http://schema.org/blogPost">
                {total_search}
                {reblogged_by}
                <div className="PostSummary__header show-for-small-only">
                    {content_title}
                </div>
                <div className="PostSummary__time_author_category_small show-for-small-only">
                    {author_category}
                </div>
                <div className="PostSummary__img-container">
                  {thumb}
                </div>
                <div className="PostSummary__content">
                    <div className={'PostSummary__header show-for-medium ' + visitedClassName}>
                        {content_title}
                    </div>
                    {content_body}
                    {content_footer}
                </div>
            </article>
        )
    }
}

export default connect(
    (state, props) => {
        const {post} = props;
        const content = state.global.get('content').get(post);
        let pending_payout = 0;
        let total_payout = 0;
        let gray, ignore
        if (content) {
            pending_payout = content.get('pending_payout_value');
            total_payout = content.get('total_payout_value');
            const stats = content.get('stats', Map()).toJS()
            gray = stats.gray
            ignore = stats.ignore
        }
        return {
            post, content, gray, ignore, pending_payout, total_payout,
            username: state.user.getIn(['current', 'username']) || state.offchain.get('account')
        };
    },

    (dispatch) => ({
        dispatchSubmit: data => { dispatch(user.actions.usernamePasswordLogin({...data})) },
        clearError: () => { dispatch(user.actions.loginError({error: null})) },
        deleteReblog: (account, author, permlink, successCallback, errorCallback) => {
            const json = ['delete_reblog', {account, author, permlink}]
            dispatch(transaction.actions.broadcastOperation({
                type: 'custom_json',
                confirm: tt('g.are_you_sure'),
                operation: {
                    id: 'follow',
                    required_posting_auths: [account],
                    json: JSON.stringify(json),
                    __config: {title: tt('g.delete_reblog')}
                },
                successCallback, errorCallback,
            }))
        },
    })
)(PostSummary)
