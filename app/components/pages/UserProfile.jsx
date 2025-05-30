/* eslint react/prop-types: 0 */
import React from 'react';
import { Link } from 'react-router';
import {connect} from 'react-redux';
import { browserHistory } from 'react-router';
import golos from 'golos-lib-js';
import tt from 'counterpart';
import { LinkWithDropdown } from 'react-foundation-components/lib/global/dropdown'

import transaction from 'app/redux/Transaction';
import user from 'app/redux/User';
import Icon from 'app/components/elements/Icon'
import UserKeys from 'app/components/elements/UserKeys';
import Settings from 'app/components/modules/Settings';
import ReputationHistory from 'app/components/modules/ReputationHistory'
import Mentions from 'app/components/modules/Mentions'
import Referrals from 'app/components/modules/Referrals'
import Sponsors from 'app/components/modules/Sponsors'
import UserList from 'app/components/elements/UserList';
import Follow from 'app/components/elements/Follow';
import LoadingIndicator from 'app/components/elements/LoadingIndicator';
import PostsList from 'app/components/cards/PostsList';
import { checkAllowed, AllowTypes } from 'app/utils/Allowance'
import { authUrl, } from 'app/utils/AuthApiClient'
import { getGameLevel } from 'app/utils/GameUtils'
import { msgsHost, msgsLink } from 'app/utils/ExtLinkUtils'
import LinkEx from 'app/utils/LinkEx'
import {isFetchingOrRecentlyUpdated} from 'app/utils/StateFunctions';
import {repLog10} from 'app/utils/ParsersAndFormatters';
import { proxifyImageUrl } from 'app/utils/ProxifyUrl';
import { walletUrl, walletTarget } from 'app/utils/walletUtils'
import Tooltip from 'app/components/elements/Tooltip';
import VerticalMenu from 'app/components/elements/VerticalMenu';
import MarkNotificationRead from 'app/components/elements/MarkNotificationRead';
import NotifiCounter from 'app/components/elements/NotifiCounter';
import DateJoinWrapper from 'app/components/elements/DateJoinWrapper';
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper';
import Userpic from 'app/components/elements/Userpic';
import Callout from 'app/components/elements/Callout';
import normalizeProfile, { getLastSeen } from 'app/utils/NormalizeProfile';
import { withScreenSize } from 'app/utils/ScreenSize'

export default class UserProfile extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            linksAlign: 'right',
        };
        this.onPrint = () => {window.print()}

        this.loadMore = this.loadMore.bind(this);
        this._onLinkRef = this._onLinkRef.bind(this);
    }

    shouldComponentUpdate(np, ns) {
        const {follow} = this.props;
        const {follow_count} = this.props;

        let followersLoading = false, npFollowersLoading = false;
        let followingLoading = false, npFollowingLoading = false;

        const account = np.routeParams.accountname.toLowerCase();
        if (follow) {
            followersLoading = follow.getIn(['getFollowersAsync', account, 'blog_loading'], false);
            followingLoading = follow.getIn(['getFollowingAsync', account, 'blog_loading'], false);
        }
        if (np.follow) {
            npFollowersLoading = np.follow.getIn(['getFollowersAsync', account, 'blog_loading'], false);
            npFollowingLoading = np.follow.getIn(['getFollowingAsync', account, 'blog_loading'], false);
        }

        return (
            np.current_user !== this.props.current_user ||
            np.accounts.get(account) !== this.props.accounts.get(account) ||
            np.wifShown !== this.props.wifShown ||
            np.global_status !== this.props.global_status ||
            ((npFollowersLoading !== followersLoading) && !npFollowersLoading) ||
            ((npFollowingLoading !== followingLoading) && !npFollowingLoading) ||
            np.loading !== this.props.loading ||
            np.location.pathname !== this.props.location.pathname ||
            np.routeParams.accountname !== this.props.routeParams.accountname ||
            np.follow_count !== this.props.follow_count ||
            ns.repLoading !== this.state.repLoading ||
            np.hideMainMe !== this.props.hideMainMe ||
            np.hideMainFor !== this.props.hideMainFor ||
            np.hideRewardsMe !== this.props.hideRewardsMe ||
            np.hideRewardsFor !== this.props.hideRewardsFor
        )
    }

    loadMore(last_post, category) {
        const {accountname} = this.props.routeParams
        if (!last_post) return;

        let order;
        switch(category) {
          case 'feed': order = 'by_feed'; break;
          case 'blog': order = 'by_author'; break;
          case 'comments': order = 'by_comments'; break;
          case 'recent_replies': order = 'by_replies'; break;
          default: console.log('unhandled category:', category);
        }

        if (isFetchingOrRecentlyUpdated(this.props.global_status, order, category)) return;
        const [author, permlink] = last_post.split('/');
        this.props.requestData({author, permlink, order, category, accountname});
    }

    voteRep = (weight) => {
        let { accountname } = this.props.routeParams;
        let rep = this.props.accounts.get(accountname).get('reputation');
        this.setState({
            repLoading: true,
        }, () => {
            const { current_user, } = this.props;
            const username = current_user ? current_user.get('username') : null;
            this.props.voteRep({
                voter: username, 
                author: accountname,
                weight,
                success: () => {
                    let refreshStart = Date.now();
                    const refresh = () => {
                        this.props.reloadAccounts([accountname, username]);
                        setTimeout(() => {
                            const now = Date.now();
                            const newRep = this.props.accounts.get(accountname).get('reputation');
                            if (newRep === rep && now - refreshStart < 5000) {
                                refresh();
                                return;
                            }
                            this.props.reloadState(window.location.pathname);
                            this.setState({
                                repLoading: false,
                            });
                        }, 500);
                    };
                    refresh();
                },
                error: (err) => {
                    this.setState({
                        repLoading: false,
                    });
                }
            });
        });
    };

    upvoteRep = (e) => {
        e.preventDefault();
        this.voteRep(10000);
    };

    downvoteRep = (e) => {
        e.preventDefault();
        this.voteRep(-10000);
    };

    render() {
        const {
            props: {current_user, current_account, wifShown, global_status, follow,
            hideMainMe, hideRewardsMe, hideMainFor, hideRewardsFor,},
            onPrint,
        } = this;
        let { accountname, section, id, action } = this.props.routeParams;
        // normalize account from cased params
        accountname = accountname.toLowerCase();
        const username = current_user ? current_user.get('username') : null
        // const gprops = this.props.global.getIn( ['props'] ).toJS();
        if( !section ) section = 'blog';

        // @user/'posts' is deprecated in favor of 'comments' as of oct-2016 (#443)
        if( section == 'posts' ) section = 'comments';

        // const isMyAccount = current_user ? current_user.get('username') === accountname : false;

        // Loading status
        const status = global_status ? global_status.getIn([section, 'by_author']) : null;
        const fetching = (status && status.fetching) || this.props.loading;

        let account
        let accountImm = this.props.accounts.get(accountname);
        if( accountImm ) {
            account = accountImm.toJS();
        } else if (fetching) {
            return <div className='UserProfile loader'>
                <div className='UserProfile__center'><LoadingIndicator type='circle' size='40px' /></div>
            </div>;
        } else {
            return <div className='UserProfile'>
                <div className='UserProfile__center'>{tt('user_profile.unknown_account')}</div>
            </div>
        }
        const followers = follow && follow.getIn(['getFollowersAsync', accountname]);
        const following = follow && follow.getIn(['getFollowingAsync', accountname]);

        // instantiate following items
        let totalCounts = this.props.follow_count;
        let followerCount = 0;
        let followingCount = 0;

        if (totalCounts && accountname) {
            totalCounts = totalCounts.get(accountname);
            if (totalCounts) {
                totalCounts    = totalCounts.toJS();
                followerCount  = totalCounts.follower_count;
                followingCount = totalCounts.following_count;
            }
        }

        const isMyAccount = username === account.name;

        let rep = golos.formatter.reputation(account.reputation, true);
        rep = parseFloat(rep.toFixed(3));

        let repPanel = null;
        let cannotUpvote = false;
        let cannotDownvote = false;
        let upvoteRep = this.upvoteRep;
        let downvoteRep = this.downvoteRep;

        if (current_account && typeof(BigInt) !== 'undefined') { // Safari < 14
            const current_rep = BigInt(current_account.get('reputation'));
            if (current_rep < 0) {
                cannotUpvote = tt('reputation_panel_jsx.cannot_vote_neg_rep');
                cannotDownvote = cannotUpvote;
            } else if (account && current_rep <= BigInt(account.reputation)) {
                cannotDownvote = tt('reputation_panel_jsx.cannot_downvote_lower_rep_ACCOUNT_NAME', {
                    ACCOUNT_NAME: account.name,
                });
            }
            if (cannotUpvote) {
                upvoteRep = (e) => { e.preventDefault(); };
            }
            if (cannotDownvote) {
                downvoteRep = (e) => { e.preventDefault(); };
            }
            repPanel = (<span className='UserProfile__rep-panel'>
                {this.state.repLoading &&
                                    (<LoadingIndicator type='circle' />)}
                {!this.state.repLoading && <a href='#' onClick={upvoteRep} className={'UserProfile__rep-btn-up' + (cannotUpvote ? ' disabled' : '')} title={cannotUpvote || tt('g.upvote')}>
                    <Icon size='1_5x' name='chevron-up-circle' />
                </a>}
                {!this.state.repLoading && <a href='#' onClick={downvoteRep} className={'UserProfile__rep-btn-down' + (cannotDownvote ? ' disabled' : '')} title={cannotDownvote || tt('g.flag')}>
                    <Icon size='1_25x' name='chevron-down-circle' />
                </a>}
            </span>);
        }

        let { levelUrl, levelTitle, levelName } = getGameLevel(accountImm, this.props.gprops)
        let level = null
        if (levelUrl) {
            level = (<img className="GameLevel" src={levelUrl} title={levelTitle} alt={levelName} />)
        }

        let tab_content = null;

        // const global_status = this.props.global.get('status');

        let rewardsClass = '', walletClass = '';
        if( section === 'followers' ) {
            if (followers && followers.has('blog_result')) {
                tab_content = <div>
                    <UserList
                        title={tt('user_profile.followers')}
                        account={account}
                        users={followers.get('blog_result')} />
                    { isMyAccount && <div><MarkNotificationRead fields='send,receive' account={account.name} /></div>}
                    </div>
            }
        }
        else if( section === 'followed' ) {
            if (following && following.has('blog_result')) {
                tab_content = <UserList
                    title={tt('user_profile.followed')}
                    account={account}
                    users={following.get('blog_result')}
                    />
            }
        }
        else if( section === 'settings' ) {
            tab_content = <Settings routeParams={this.props.routeParams} />
        }
        else if( section === 'comments') {
           if( account.comments )
           {
                let posts = accountImm.get('posts') || accountImm.get('comments');
                if (!fetching && (posts && !posts.size)) {
                    tab_content = <Callout>{tt('user_profile.user_hasnt_made_any_posts_yet', {name: accountname})}</Callout>;
                } else {
                  tab_content = (
                      <div>
                        <PostsList
                            posts={posts}
                            loading={fetching}
                            category='comments'
                            loadMore={this.loadMore}
                            showSpam
                        />
                      </div>
                    );
                }
           }
           else {
              tab_content = (<center><LoadingIndicator type='circle' /></center>);
           }
        } else if(!section || section === 'blog') {
            if (account.blog) {
                let posts = accountImm.get('blog');
                const emptyText = isMyAccount ? <div>
                    {tt('submit_a_story.you_hasnt_started_bloggin_yet')}<br /><br />
                    <Link to='/submit'>{tt('g.submit_a_story')}</Link><br />
                    <a href='/welcome'>{tt('submit_a_story.welcome_to_the_blockchain')}</a>
                </div>:
                    tt('user_profile.user_hasnt_started_bloggin_yet', {name: accountname});

                if (!fetching && (posts && !posts.size)) {
                    tab_content = <Callout>{emptyText}</Callout>;
                } else {
                    tab_content = (
                        <PostsList
                            account={account.name}
                            posts={posts}
                            loading={fetching}
                            category='blog'
                            loadMore={this.loadMore}
                            showSpam
                        />
                    );
                }
            } else {
                tab_content = (<center><LoadingIndicator type='circle' /></center>);
            }
        }
        else if( (section === 'recent-replies')) {
            if (account.recent_replies) {
                let posts = accountImm.get('recent_replies');
                if (!fetching && (posts && !posts.size)) {
                    tab_content = <Callout>{tt('user_profile.user_hasnt_had_any_replies_yet', {name: accountname}) + '.'}</Callout>;
                } else {
                    tab_content = (
                        <div>
                            <PostsList
                                posts={posts}
                                loading={fetching}
                                category='recent_replies'
                                loadMore={this.loadMore}
                                showSpam={false}
                            />
                            {isMyAccount && <div><MarkNotificationRead fields='comment_reply' account={account.name} /></div>}
                        </div>
                    );
                }
          } else {
              tab_content = (<center><LoadingIndicator type='circle' /></center>);
          }
        }
        else if( (section === 'discussions')) {
            if (account.discussions) {
                let posts = accountImm.get('discussions');
                if (posts && !posts.size) {
                    tab_content = <Callout>{tt('user_profile.user_hasnt_followed_anything', {name: accountname}) + '.'}</Callout>
                } else {
                    tab_content = (
                        <div>
                            <PostsList
                                posts={posts}
                                loading={fetching}
                                category='discussions'
                                loadMore={this.loadMore}
                                showSpam={false}
                            />
                            {isMyAccount && <div><MarkNotificationRead fields='subscriptions' account={account.name} /></div>}
                        </div>
                    )
                }
          } else {
              tab_content = (<center><LoadingIndicator type='circle' /></center>);
          }
        }
        else if( (section === 'reputation')) {
            tab_content = (
                <div>
                    <ReputationHistory
                        account={account}
                        current_user={current_user}
                        loading={fetching}
                    />
                </div>
            );
        }
        else if( (section === 'mentions')) {
            tab_content = (
                <div>
                    <Mentions
                        account={account}
                        current_user={current_user}
                        loading={fetching}
                    />
                    { isMyAccount && <div><MarkNotificationRead fields='mention' account={account.name} /></div> }
                </div>
            );
        } else if (section === 'sponsors') {
            tab_content = <div>
                <Sponsors account={account} current_user={current_user} />
                <MarkNotificationRead fields='new_sponsor,sponsor_inactive' account={account.name} />
            </div>
        } else if (section === 'referrals') {
            tab_content = <div>
                <Referrals account={account} current_user={current_user} />
                <MarkNotificationRead fields='referral' account={account.name} />
            </div>
        }

        tab_content = <div className='row'>
            <div className='UserProfile__tab_content column'>
                {tab_content}
            </div>
        </div>

        let donates_to_addon = undefined;
        if (isMyAccount) donates_to_addon = <NotifiCounter fields='donate,donate_msgs' />;
        let rewardsMenu = [
            {link: walletUrl(`/@${accountname}/donates-to`), target: walletTarget(), label: tt('g.donates_to'), value: tt('g.donates_to'), addon: donates_to_addon},
            {link: walletUrl(`/@${accountname}/donates-from`), target: walletTarget(), label: tt('g.donates_from'), value: tt('g.donates_from')},
            {link: walletUrl(`/@${accountname}/author-rewards`), target: walletTarget(), label: tt('g.author_rewards'), value: tt('g.author_rewards')},
            {link: walletUrl(`/@${accountname}/curation-rewards`), target: walletTarget(), label: tt('g.curation_rewards'), value: tt('g.curation_rewards')}
        ];

        // set account join date
        let accountjoin = account.created;
        const transferFromSteemToGolosDate = '2016-09-29T12:00:00';
        if (new Date(accountjoin) < new Date(transferFromSteemToGolosDate)) {
          accountjoin = transferFromSteemToGolosDate;
        }

        const hideMain = isMyAccount ? hideMainMe : hideMainFor
        const hideRewards = isMyAccount ? hideRewardsMe : hideRewardsFor
        let mentionCounter = isMyAccount && <NotifiCounter fields='mention' />
        let disCounter = isMyAccount && <NotifiCounter fields='subscriptions' />
        let walletCounter = isMyAccount && <NotifiCounter fields='send,receive,fill_order,nft_receive,nft_token_sold,nft_buy_offer' />

        let kebab
        let kebabNotify = ''
        if (hideMain) {
            let kebabMenu = [
                { link: `/@${accountname}/mentions`, label: tt('g.mentions'), value: tt('g.mentions'), addon: mentionCounter }
            ]
            if (isMyAccount) {
                kebabMenu.unshift({ link: `/@${accountname}/discussions`, label: tt('g.discussions'), value: tt('g.discussions'), addon: disCounter })
                kebabMenu.push({ value: '-' })
                kebabMenu.push({ link: `/@${accountname}/settings`, label: tt('g.settings'), value: tt('g.settings') })
                kebabNotify += ',mention,subscriptions'
            }
            if (hideRewards) {
                kebabMenu = [
                    ...rewardsMenu,
                    { value: '-' },
                    ...kebabMenu,
                ]
                kebabNotify += ',donate,donate_msgs'
            }
            kebabMenu = [
                { link: walletUrl(`/@${accountname}/transfers`), target: walletTarget(), label: tt('g.wallet'), value: tt('g.wallet'), addon: walletCounter },
                { value: '-' },
                ...kebabMenu,
            ]
            kebabNotify += ',send,receive,fill_order,nft_receive,nft_token_sold,nft_buy_offer'

            if (kebabMenu.length) {
                if (kebabMenu[kebabMenu.length - 1].value === '-') kebabMenu.pop()
            }
            if (kebabNotify[0] === ',') kebabNotify = kebabNotify.slice(1)
            kebab = kebabMenu.length ? <LinkWithDropdown
                closeOnClickOutside
                dropdownPosition='bottom'
                dropdownAlignment={this.state.linksAlign}
                dropdownContent={<VerticalMenu items={kebabMenu} />}
                >
                <a className={`UserProfile__menu-item`}>
                    <Icon name='new/more' />
                    {(isMyAccount && kebabNotify) ? <NotifiCounter fields={kebabNotify} /> : null}
                </a>
            </LinkWithDropdown> : null
        }

        const top_menu = <div className='row UserProfile__top-menu'>
            <div className='columns'>
                <div className='UserProfile__menu menu' style={{flexWrap: 'wrap'}}>
                    <Link className='UserProfile__menu-item' to={`/@${accountname}`} activeClassName='active'>
                    	{tt('g.blog')}
                    </Link>
                    <Link className='UserProfile__menu-item' to={`/@${accountname}/comments`} activeClassName='active'>
                    	{tt('g.comments')}
                    </Link>
                    <Link className='UserProfile__menu-item' to={`/@${accountname}/recent-replies`} activeClassName='active'>
                        {tt('g.replies')} {isMyAccount && <NotifiCounter fields='comment_reply' />}
                    </Link>
                    {(!hideMain && isMyAccount) ? <Link className='UserProfile__menu-item' to={`/@${accountname}/discussions`} activeClassName='active'>
                        {tt('g.discussions')} {disCounter}
                    </Link> : null}
                    {!hideMain && <Link className='UserProfile__menu-item' to={`/@${accountname}/mentions`} activeClassName='active'>
                        {tt('g.mentions')} {mentionCounter}
                    </Link>}
                    <div className='UserProfile__filler' />
                    <div>
                        {!hideMain && <a href={walletUrl(`/@${accountname}/transfers`)} target={walletTarget()} className={`${walletClass} UserProfile__menu-item`}>
                            {tt('g.wallet')} {walletCounter}
                        </a>}
                        {!hideRewards && <LinkWithDropdown
                            closeOnClickOutside
                            dropdownPosition='bottom'
                            dropdownAlignment={this.state.linksAlign}
                            dropdownContent={<VerticalMenu items={rewardsMenu} />}
                        	>
                            <a className={`${rewardsClass} UserProfile__menu-item`} ref={this._onLinkRef}>
                                {tt('g.rewards')}
                                {isMyAccount && <NotifiCounter fields='donate,donate_msgs' />}
                                <Icon name='dropdown-center' />
                            </a>
	                    </LinkWithDropdown>}
                        {isMyAccount && msgsHost() ? <a target='_blank' rel='noopener noreferrer' className='UserProfile__menu-item' href={msgsLink()} title={tt('g.messages')}>
                            <Icon name='new/envelope' /> <NotifiCounter fields='message' />
                        </a> : null}
                        {(isMyAccount && !hideMain) ? <Link className='UserProfile__menu-item' to={`/@${accountname}/settings`} activeClassName='active' title={tt('g.settings')}>
                            <Icon name='new/setting' />
                        </Link> : null}
                        {kebab}
                    </div>
                </div>
            </div>
         </div>;

        const { name, location, about, website, cover_image } = normalizeProfile(account)
        const website_label = website ? website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') : null

        let cover_image_style = {}
        if(cover_image) {
            const cover_image_url = proxifyImageUrl(cover_image);
            cover_image_style = {backgroundImage: 'url(' + cover_image_url + ')'}
        }

        const lastSeen = getLastSeen(account);

        const frozen = account.frozen

        return (
            <div className='UserProfile'>

                <div className='UserProfile__banner row expanded'>

                    <div className='column' style={cover_image_style}>
                        <div className='UserProfile__buttons-wrapper'>
                            <div className='UserProfile__buttons'>
                                {(msgsHost() && (!username || username !== accountname)) ? <a href={msgsLink(accountname)} target='_blank' rel='noopener noreferrer'><label className='button slim hollow secondary '>{tt('g.write_message')}</label></a> : null}
                                <Follow follower={username} following={accountname} />
                            </div>
                        </div>

                        <h1>
                            <Userpic account={account.name} hideIfDefault />
                            {name || account.name}{' '}

                            {!this.state.repLoading && <Link to={`/@${account.name}/reputation`}>
                                <span className='UserProfile__rep UserProfile__rep-btn' title={tt('user_profile.this_is_users_reputations_score_it_is_based_on_history_of_votes', {name: accountname})}>({rep})</span>
                            </Link>}
                            {repPanel}
                            {level}
                        </h1>

                        <div>
                            {about && <p className='UserProfile__bio'>{about}</p>}
                            <div className='UserProfile__stats'>
                                <span><Link to={`/@${accountname}/followers`}>{tt('user_profile.follower_count', {count: followerCount})}</Link></span>
                                <span><Link to={`/@${accountname}`}>{tt('user_profile.post_count', {count: account.post_count || 0})}</Link></span>
                                <span><Link to={`/@${accountname}/followed`}>{tt('user_profile.followed_count', {count: followingCount})}</Link></span>
                                <span className='sponsors_notify'><Link to={`/@${accountname}/sponsors`}>{tt('user_profile.sponsor_count', {count: account.sponsor_count || 0})}
                                    {isMyAccount && <NotifiCounter fields='new_sponsor,sponsor_inactive' />}
                                </Link></span>
                                <span className='sponsors_notify'><Link to={`/@${accountname}/referrals`}>{tt('user_profile.referral_count', {count: account.referral_count || 0})}
                                    {isMyAccount && <NotifiCounter fields='referral' />}
                                </Link></span>
                            </div>
                            <p className='UserProfile__info'>
                                {location && <span><Icon name='location' /> {location}</span>}
                                {website && <span><Icon name='link' /> <a href={website}>{website_label}</a></span>}
                                <Icon name='calendar' /> <DateJoinWrapper date={accountjoin} />
                                {lastSeen && <span><Icon name='eye' /> {tt('g.last_seen')} <TimeAgoWrapper date={`${lastSeen}`} /> </span>}
                                {frozen ? <div className='UserProfile__frozen'>
                                    <Icon name='flag' size='1_5x' /> {tt('user_profile.account_frozen')}
                                    &nbsp;
                                    <a href={authUrl('/sign/unfreeze/' + accountname)} target='_blank' rel='noreferrer noopener'>
                                        {tt('g.more_hint')}
                                    </a>
                                </div> : null}
                            </p>
                        </div>
                        <div className='UserProfile__buttons-mobile'>
                            <Follow follower={username} following={accountname} what='blog' />
                        </div>
                    </div>
                </div>
                <div className='UserProfile__top-nav row expanded noPrint'>
                    {top_menu}
                </div>
                <div>
                  {tab_content}
                </div>
            </div>
        );
    }

    _onLinkRef(el) {
        if (el) {
            if (this.state.linksAlign !== 'left' && el.offsetLeft + (el.offsetWidth / 2) < (window.outerWidth / 2)) {
                this.setState({
                    linksAlign: 'left',
                });
            }
        }
    }
}

module.exports = {
    path: '@:accountname(/:section)(/:id)(/:action)',
    component: connect(
        state => {
            const wifShown = state.global.get('UserKeys_wifShown')
            const current_user = state.user.get('current')
            const current_account = current_user && state.global.getIn(['accounts', current_user.get('username')])
            const gprops = state.global.get('props')

            return {
                discussions: state.global.get('discussion_idx'),
                current_user,
                current_account,
                gprops,
                wifShown,
                loading: state.app.get('loading'),
                global_status: state.global.get('status'),
                accounts: state.global.get('accounts'),
                follow: state.global.get('follow'),
                follow_count: state.global.get('follow_count')
            };
        },
        dispatch => ({
            login: () => {dispatch(user.actions.showLogin())},
            voteRep: async ({voter, author, weight, success, error}) => {
                let blocking
                if (weight < 0) {
                    blocking = await checkAllowed(voter, [],
                        null, AllowTypes.voteRep)
                    if (blocking.error) {
                        dispatch({
                            type: 'ADD_NOTIFICATION',
                            payload: {
                                message: blocking.error,
                                dismissAfter: 5000,
                            },
                        })
                        return
                    }
                }
                const confirm = () => {
                    if (blocking && blocking.confirm) return blocking.confirm
                    if (weight < 0) {
                        return tt('reputation_panel_jsx.confirm_downvote_ACCOUNT_NAME', {
                            ACCOUNT_NAME: author,
                        });
                    }
                    return tt('reputation_panel_jsx.confirm_upvote_ACCOUNT_NAME', {
                        ACCOUNT_NAME: author,
                    });
                };
                dispatch(transaction.actions.broadcastOperation({
                    type: 'vote',
                    operation: {
                        voter,
                        author,
                        permlink: '',
                        weight,
                        __config: {title: tt('reputation_panel_jsx.confirm_title'),},
                    },
                    confirm,
                    successCallback: () => {
                        success();
                    },
                    errorCallback: (err) => {
                        error(err);
                    },
                }));
            },
            reloadAccounts: (usernames) => {
                dispatch(user.actions.getAccount({usernames: [...new Set(usernames)]}));
            },
            reloadState: (pathname) => {
                dispatch({type: 'FETCH_STATE', payload: {pathname}});
            },
            requestData: (args) => dispatch({type: 'REQUEST_DATA', payload: args}),
        })
    )(withScreenSize(UserProfile))
};
