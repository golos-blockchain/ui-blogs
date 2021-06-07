import React from 'react';
import PropTypes from 'prop-types'
import { Link } from 'react-router';
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper';
import Icon from 'app/components/elements/Icon';
import { connect } from 'react-redux';
import user from 'app/redux/User';
import Reblog from 'app/components/elements/Reblog';
import MuteAuthorInNew from 'app/components/elements/MuteAuthorInNew';
import PinPost from 'app/components/elements/PinPost';
import Voting from 'app/components/elements/Voting';
import {immutableAccessor} from 'app/utils/Accessors';
import extractContent from 'app/utils/ExtractContent';
import { blockedUsers } from 'app/utils/IllegalContent'
import { browserHistory } from 'react-router';
import VotesAndComments from 'app/components/elements/VotesAndComments';
import TagList from 'app/components/elements/TagList';
import {authorNameAndRep} from 'app/utils/ComponentFormatters';
import {Map} from 'immutable';
import Author from 'app/components/elements/Author';
import UserNames from 'app/components/elements/UserNames';
import tt from 'counterpart';
import { APP_ICON, CHANGE_IMAGE_PROXY_TO_STEEMIT_TIME } from 'app/client_config';
import { detransliterate } from 'app/utils/ParsersAndFormatters';
import PostSummaryThumb from 'app/components/elements/PostSummaryThumb'

function isLeftClickEvent(event) {
    return event.button === 0
}

function isModifiedEvent(event) {
    return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
}

function navigate(e, onClick, post, url, isForum) {
    if (isForum)
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
               props.visited !== this.props.visited;
    }

    onRevealNsfw(e) {
        e.preventDefault();
        this.setState({revealNsfw: true})
    }

    render() {
        const {currentCategory, thumbSize, ignore, onClick} = this.props;
        const {post, content, pending_payout, total_payout, cashout_time, blockEye} = this.props;
        const {account} = this.props;
        const {nsfwPref, username} = this.props
        if (!content) return null;

        const myPost = username === content.get('author')

        if(blockedUsers.includes(content.get('author'))) {
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

        if(account && account != content.get('author')) {
          reblogged_by = <div className="PostSummary__reblogged_by">
                             <Icon name="reblog" /> {tt('postsummary_jsx.resteemed')}
                         </div>
        }

        const {gray, pictures, authorRepLog10, flagWeight, isNsfw} = content.get('stats', Map()).toJS()
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
        const promoted_post = content.get('promoted') >= "1.000 GBG";

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

        if (username && !is_forum)
            title_link_url += "?invite=" + username;

        const link_target = is_forum ? '_blank' : undefined;

        let content_body = <div className="PostSummary__body entry-content">
            <a href={title_link_url} target={link_target} onClick={e => navigate(e, onClick, post, title_link_url, is_forum)}>{desc}</a>
        </div>;

        const warn = (isNsfw && nsfwPref === 'warn' && !myPost);
        const promosumm = tt('g.promoted_post') + content.get('promoted');

        let content_title = <h3 className="entry-title">
            <a href={title_link_url} target={link_target} onClick={e => navigate(e, onClick, post, title_link_url, is_forum)}>
                {warn && <span className="nsfw-flag">{detransliterate(nsfwTitle)}</span>}
                {title_text}
            </a>
            {promoted_post && <a target="_blank" href="https://wiki.golos.id/users/welcome#prodvinut-post"><span className="promoted_post" title={promosumm}>{tt('g.promoted_title')}</span></a>}
        </h3>;

        // author and category
        let author_category = <span className="vcard">
            <a href={title_link_url} target={link_target} onClick={e => navigate(e, onClick, post, title_link_url, is_forum)}><TimeAgoWrapper date={is_forum ? p.active : p.created} className="updated" /></a>
            {' '}
            {blockEye && <MuteAuthorInNew author={p.author} />}
            <Author author={p.author} authorRepLog10={authorRepLog10} follow={false} mute={false} />
            {} {tt('g.in')} <TagList post={p} single />
        </span>

        const content_footer = <div className="PostSummary__footer">
            <Voting post={post} showList={false} />
            <VotesAndComments post={post} commentsLink={comments_link} isForum={is_forum} />
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
          const prox = $STM_Config.img_proxy_prefix
          const size = (thumbSize == 'mobile') ? '800x600' : '256x512'

          let url = (prox ? prox + size + '/' : '');
          url += p.image_link

          // Proxy old images
          // if (Date.parse(p.created) > CHANGE_IMAGE_PROXY_TO_STEEMIT_TIME) {
          //   url += p.image_link
          // } else {
          //   url += 'https://img.golos.io/proxy/' + p.image_link
          // }

          thumb = <PostSummaryThumb
              visitedClassName={visitedClassName}
              mobile={thumbSize == 'mobile'}
              isNsfw={warn}
              src={url}
              href={title_link_url}
              target={link_target}
              onClick={e => navigate(e, onClick, post, title_link_url, is_forum)} />
        }
        const commentClasses = []
        if(gray || ignore) commentClasses.push('downvoted') // rephide

        return (
            <article className={'PostSummary hentry' + (thumb ? ' with-image ' : ' ') + commentClasses.join(' ')} itemScope itemType ="http://schema.org/blogPost">
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
        if (content) {
            pending_payout = content.get('pending_payout_value');
            total_payout = content.get('total_payout_value');
        }
        return {
            post, content, pending_payout, total_payout,
            username: state.user.getIn(['current', 'username']) || state.offchain.get('account')
        };
    },

    (dispatch) => ({
        dispatchSubmit: data => { dispatch(user.actions.usernamePasswordLogin({...data})) },
        clearError: () => { dispatch(user.actions.loginError({error: null})) }
    })
)(PostSummary)
