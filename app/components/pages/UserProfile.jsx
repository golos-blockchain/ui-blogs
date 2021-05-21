/* eslint react/prop-types: 0 */
import React from 'react';
import { Link } from 'react-router';
import {connect} from 'react-redux';
import { browserHistory } from 'react-router';
import transaction from 'app/redux/Transaction';
import user from 'app/redux/User';
import Icon from 'app/components/elements/Icon'
import UserKeys from 'app/components/elements/UserKeys';
import CreateAsset from 'app/components/elements/CreateAsset';
import Assets from 'app/components/elements/Assets';
import UpdateAsset from 'app/components/elements/UpdateAsset';
import TransferAsset from 'app/components/elements/TransferAsset';
import Invites from 'app/components/elements/Invites';
import PasswordReset from 'app/components/elements/PasswordReset';
import UserWallet from 'app/components/modules/UserWallet';
import WitnessProps from 'app/components/modules/WitnessProps';
import Settings from 'app/components/modules/Settings';
import DonatesFrom from 'app/components/modules/DonatesFrom';
import DonatesTo from 'app/components/modules/DonatesTo';
import CurationRewards from 'app/components/modules/CurationRewards';
import AuthorRewards from 'app/components/modules/AuthorRewards';
import UserList from 'app/components/elements/UserList';
import Follow from 'app/components/elements/Follow';
import LoadingIndicator from 'app/components/elements/LoadingIndicator';
import PostsList from 'app/components/cards/PostsList';
import {isFetchingOrRecentlyUpdated} from 'app/utils/StateFunctions';
import {repLog10} from 'app/utils/ParsersAndFormatters';
import Tooltip from 'app/components/elements/Tooltip';
import { LinkWithDropdown } from 'react-foundation-components/lib/global/dropdown';
import VerticalMenu from 'app/components/elements/VerticalMenu';
import MarkNotificationRead from 'app/components/elements/MarkNotificationRead';
import NotifiCounter from 'app/components/elements/NotifiCounter';
import DateJoinWrapper from 'app/components/elements/DateJoinWrapper';
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper';
import tt from 'counterpart';
import WalletSubMenu from 'app/components/elements/WalletSubMenu';
import Userpic from 'app/components/elements/Userpic';
import Callout from 'app/components/elements/Callout';
import normalizeProfile, { getLastSeen } from 'app/utils/NormalizeProfile';

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

    shouldComponentUpdate(np) {
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
            np.follow_count !== this.props.follow_count
        )
    }

    componentWillUnmount() {
        this.props.clearTransferDefaults()
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

    render() {
        const {
            props: {current_user, wifShown, global_status, follow},
            onPrint
        } = this;
        let { accountname, section, id, action } = this.props.routeParams;
        // normalize account from cased params
        accountname = accountname.toLowerCase();
        const username = current_user ? current_user.get('username') : null
        // const gprops = this.props.global.getIn( ['props'] ).toJS();
        if( !section ) section = 'blog';

        // @user/"posts" is deprecated in favor of "comments" as of oct-2016 (#443)
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
            return <div className="UserProfile loader">
                <div className="UserProfile__center"><LoadingIndicator type="circle" size="40px" /></div>
            </div>;
        } else {
            return <div className="UserProfile">
                <div className="UserProfile__center">{tt('user_profile.unknown_account')}</div>
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

        const rep = repLog10(account.reputation);

        const isMyAccount = username === account.name
        let tab_content = null;

        // const global_status = this.props.global.get('status');

        let rewardsClass = "", walletClass = "";
        if( section === 'transfers' ) {
            // transfers, check if url has query params
            const { location: { query } } = this.props;
            const {to, amount, token, memo} = query;
            const hasAllParams = (!!to && !!amount && !!token && !!memo);
            walletClass = 'active'
            tab_content = <div>
                <UserWallet
                    transferDetails={{immediate: hasAllParams, ...query}}
                    account={accountImm}
                    showTransfer={this.props.showTransfer}
                    showPowerdown={this.props.showPowerdown}
                    current_user={current_user}
                    withdrawVesting={this.props.withdrawVesting} />
                { isMyAccount && <div><MarkNotificationRead fields="send,receive" account={account.name} /></div> }
                </div>;
        } else if( section === 'assets' ) {
            walletClass = 'active'
            tab_content = <div>
                 <WalletSubMenu account_name={account.name} isMyAccount={isMyAccount} />

                <br />
                {!action && <Assets account={accountImm} isMyAccount={isMyAccount}
                    showTransfer={this.props.showTransfer} />
                }
                {action === 'update' && <UpdateAsset account={accountImm} symbol={id.toUpperCase()} />}
                {action === 'transfer' && <TransferAsset account={accountImm} symbol={id.toUpperCase()} />}
                </div>
        } else if( section === 'create-asset' && isMyAccount ) {
            walletClass = 'active'
            tab_content = <div>
                 <WalletSubMenu account_name={account.name} isMyAccount={isMyAccount} />

                <br />
                <CreateAsset account={accountImm} />
                </div>;
        }
        else if( section === 'curation-rewards' ) {
            rewardsClass = "active";
            tab_content = <CurationRewards
                account={account}
                current_user={current_user}
                />
        }
        else if( section === 'author-rewards' ) {
            rewardsClass = "active";
            tab_content = <AuthorRewards
                account={account}
                current_user={current_user}
                />
        }
        else if( section === 'donates-from' ) {
            rewardsClass = "active";
            tab_content = <DonatesFrom
                account={account}
                current_user={current_user}
                incoming={true}
                />
        }
        else if( section === 'donates-to' ) {
            rewardsClass = "active";
            tab_content = <div>
                <DonatesTo
                    account={account}
                    current_user={current_user}
                    incoming={false}
                    />
                    { isMyAccount && <div><MarkNotificationRead fields="donate" account={account.name} /></div> }
                </div>
        }
        else if( section === 'followers' ) {
            if (followers && followers.has('blog_result')) {
                tab_content = <div>
                    <UserList
                        title={tt('user_profile.followers')}
                        account={account}
                        users={followers.get('blog_result')} />
                    { isMyAccount && <div><MarkNotificationRead fields="send,receive" account={account.name} /></div>}
                    </div>
            }
        }
        else if( section === 'followed' ) {
            if (following && following.has('blog_result')) {
                tab_content = <UserList
                    title="Followed"
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
                            category="comments"
                            loadMore={this.loadMore}
                            showSpam
                        />
                      </div>
                    );
                }
           }
           else {
              tab_content = (<center><LoadingIndicator type="circle" /></center>);
           }
        } else if(!section || section === 'blog') {
            if (account.blog) {
                let posts = accountImm.get('blog');
                const emptyText = isMyAccount ? <div>
                    {tt('submit_a_story.you_hasnt_started_bloggin_yet')}<br /><br />
                    <Link to="/submit">{tt('g.submit_a_story')}</Link><br />
                    <a href="/welcome">{tt('submit_a_story.welcome_to_the_blockchain')}</a>
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
                            category="blog"
                            loadMore={this.loadMore}
                            showSpam
                        />
                    );
                }
            } else {
                tab_content = (<center><LoadingIndicator type="circle" /></center>);
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
                                category="recent_replies"
                                loadMore={this.loadMore}
                                showSpam={false}
                            />
                            {isMyAccount && <div><MarkNotificationRead fields="comment_reply,post_reply" account={account.name} /></div>}
                        </div>
                    );
                }
          } else {
              tab_content = (<center><LoadingIndicator type="circle" /></center>);
          }
        }
        else if( section === 'permissions' && isMyAccount ) {
            walletClass = 'active'
            tab_content = <div>
                 <WalletSubMenu account_name={account.name} isMyAccount={isMyAccount} />

                <br />
                <UserKeys account={accountImm} />
                { isMyAccount && <div><MarkNotificationRead fields="send,receive" account={account.name} /></div>}
                </div>;
        } 
        else if( section === 'invites' && isMyAccount ) {
            walletClass = 'active'
            tab_content = <div>
                 <WalletSubMenu account_name={account.name} isMyAccount={isMyAccount} />

                <br />
                <Invites account={accountImm} />
                </div>;
        } 
        else if( section === 'password' ) {
            walletClass = 'active'
            tab_content = <div>
                    <WalletSubMenu account_name={account.name} isMyAccount={isMyAccount} />

                    <br />
                    <PasswordReset account={accountImm} />
                </div>
        }
        else if( section === 'witness' ) {
            tab_content = <WitnessProps 
                account={account} />
        } 

        if (!(section === 'transfers' ||
              section === 'assets' ||
              section === 'create-asset' ||
              section === 'permissions' ||
              section === 'password' ||
              section === 'invites')) {
            tab_content = <div className="row">
                <div className="UserProfile__tab_content column">
                    {tab_content}
                </div>
            </div>;
        }

        let printLink = null;
        if( section === 'permissions' ) {
           if(isMyAccount && wifShown) {
               printLink = <div><a className="float-right noPrint" onClick={onPrint}>
                       <Icon name="printer" />&nbsp;{tt('g.print')}&nbsp;&nbsp;
                   </a></div>
           }
        }

        // const wallet_tab_active = section === 'transfers' || section === 'password' || section === 'permissions' ? 'active' : ''; // className={wallet_tab_active}

        let donates_to_addon = undefined;
        if (isMyAccount) donates_to_addon = <NotifiCounter fields="donate" />;
        let rewardsMenu = [
            {link: `/@${accountname}/donates-to`, label: tt('g.donates_to'), value: tt('g.donates_to'), addon: donates_to_addon},
            {link: `/@${accountname}/donates-from`, label: tt('g.donates_from'), value: tt('g.donates_from')},
            {link: `/@${accountname}/author-rewards`, label: tt('g.author_rewards'), value: tt('g.author_rewards')},
            {link: `/@${accountname}/curation-rewards`, label: tt('g.curation_rewards'), value: tt('g.curation_rewards')}
        ];

        // set account join date
        let accountjoin = account.created;
        const transferFromSteemToGolosDate = '2016-09-29T12:00:00';
        if (new Date(accountjoin) < new Date(transferFromSteemToGolosDate)) {
          accountjoin = transferFromSteemToGolosDate;
        }

        const top_menu = <div className="row UserProfile__top-menu">
            <div className="columns">
                <div className="UserProfile__menu menu" style={{flexWrap: "wrap"}}>
                    <Link className="UserProfile__menu-item" to={`/@${accountname}`} activeClassName="active">{tt('g.blog')}</Link>
                    <Link className="UserProfile__menu-item" to={`/@${accountname}/comments`} activeClassName="active">{tt('g.comments')}</Link>
                    <Link className="UserProfile__menu-item" to={`/@${accountname}/recent-replies`} activeClassName="active">
                        {tt('g.replies')} {isMyAccount && <NotifiCounter fields="comment_reply" />}
                    </Link>
                    <Link target="_blank" className="UserProfile__menu-item" to={`/msgs`}>
                        {tt('g.messages')} {isMyAccount && <NotifiCounter fields="message" />}
                    </Link>
                    <Link className="UserProfile__menu-item" to={`/search/@${accountname}`}>{tt('g.search')}
                    </Link>
                    <LinkWithDropdown
                        closeOnClickOutside
                        dropdownPosition="bottom"
                        dropdownAlignment={this.state.linksAlign}
                        dropdownContent={
                            <VerticalMenu items={rewardsMenu} />
                        }
                    >
                        <a
                            className={`${rewardsClass} UserProfile__menu-item`}
                            ref={this._onLinkRef}
                        >
                            {tt('g.rewards')}
                            {isMyAccount && <NotifiCounter fields="donate" />}
                            <Icon name="dropdown-arrow" />
                        </a>
                    </LinkWithDropdown>
                    <div className="UserProfile__filler" />
                    <div>
                        <a href={`/@${accountname}/transfers`} className={`${walletClass} UserProfile__menu-item`} onClick={e => { e.preventDefault(); browserHistory.push(e.target.pathname); return false; }}>
                            {tt('g.wallet')} {isMyAccount && <NotifiCounter fields="send,receive" />}
                        </a>
                        {isMyAccount ?
                            <Link className="UserProfile__menu-item" to={`/@${accountname}/settings`} activeClassName="active">{tt('g.settings')}</Link>
                            : null
                        }
                    </div>
                </div>
            </div>
         </div>;

        const { name, gender, location, about, website, cover_image } = normalizeProfile(account)
        const website_label = website ? website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') : null

        let cover_image_style = {}
        if(cover_image) {
            const cover_image_url = $STM_Config.img_proxy_prefix ? $STM_Config.img_proxy_prefix + '0x0' + '/' + cover_image : null
            cover_image_style = {backgroundImage: "url(" + cover_image_url + ")"}
        }

        let genderIcon;
        if (gender && gender != "undefined")
            genderIcon = <span><Icon name={gender} /></span>

        const lastSeen = getLastSeen(account);

        return (
            <div className="UserProfile">

                {section !== 'witness' && <div className="UserProfile__banner row expanded">

                    <div className="column" style={cover_image_style}>
                        <div className="UserProfile__buttons-wrapper">
                            <div className="UserProfile__buttons">
                                {(!username || username !== accountname) ? <a href={"/msgs/@" + accountname} target='_blank'><label className="button slim hollow secondary ">{tt('g.write_message')}</label></a> : null}
                                <Follow follower={username} following={accountname} />
                            </div>
                        </div>

                        <h1>
                            <Userpic account={account.name} hideIfDefault />
                            {name || account.name}{' '}
                            {genderIcon}
                            <Tooltip t={tt('user_profile.this_is_users_reputations_score_it_is_based_on_history_of_votes', {name: accountname})}>
                                <span className="UserProfile__rep">({rep})</span>
                            </Tooltip>
                        </h1>

                        <div>
                            {about && <p className="UserProfile__bio">{about}</p>}
                            <div className="UserProfile__stats">
                                <span><Link to={`/@${accountname}/followers`}>{tt('user_profile.follower_count', {count: followerCount})}</Link></span>
                                <span><Link to={`/@${accountname}`}>{tt('user_profile.post_count', {count: account.post_count || 0})}</Link></span>
                                <span><Link to={`/@${accountname}/followed`}>{tt('user_profile.followed_count', {count: followingCount})}</Link></span>
                            </div>
                            <p className="UserProfile__info">
                                {location && <span><Icon name="location" /> {location}</span>}
                                {website && <span><Icon name="link" /> <a href={website}>{website_label}</a></span>}
                                <Icon name="calendar" /> <DateJoinWrapper date={accountjoin} />
                                {lastSeen && <span><Icon name="eye" /> {tt('g.last_seen')} <TimeAgoWrapper date={`${lastSeen}`} /> </span>}
                            </p>
                        </div>
                        <div className="UserProfile__buttons-mobile">
                            <Follow follower={username} following={accountname} what="blog" />
                        </div>
                    </div>
                </div>}
                {section !== 'witness' && <div className="UserProfile__top-nav row expanded noPrint">
                    {top_menu}
                </div>}
                <div>
                  {/*printLink*/}
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
            // const current_account = current_user && state.global.getIn(['accounts', current_user.get('username')])

            return {
                discussions: state.global.get('discussion_idx'),
                current_user,
                // current_account,
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
            clearTransferDefaults: () => {dispatch(user.actions.clearTransferDefaults())},
            showTransfer: (transferDefaults) => {
                dispatch(user.actions.setTransferDefaults(transferDefaults))
                dispatch(user.actions.showTransfer())
            },
            showPowerdown: powerdownDefaults => {
                dispatch(user.actions.setPowerdownDefaults(powerdownDefaults));
                dispatch(user.actions.showPowerdown());
            },
            withdrawVesting: ({account, vesting_shares, errorCallback, successCallback}) => {
                const successCallbackWrapper = (...args) => {
                    dispatch({type: 'FETCH_STATE', payload: {pathname: `@${account}/transfers`}})
                    return successCallback(...args)
                }
                dispatch(transaction.actions.broadcastOperation({
                    type: 'withdraw_vesting',
                    operation: {account, vesting_shares},
                    errorCallback,
                    successCallback: successCallbackWrapper,
                }))
            },
            requestData: (args) => dispatch({type: 'REQUEST_DATA', payload: args}),
        })
    )(UserProfile)
};
