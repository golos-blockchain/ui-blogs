/* eslint react/prop-types: 0 */
import React from 'react';
import PropTypes from 'prop-types'
import {connect} from 'react-redux';
import Topics from './Topics';
import constants from 'app/redux/constants';
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate';
import PostsList from 'app/components/cards/PostsList';
import {isFetchingOrRecentlyUpdated} from 'app/utils/StateFunctions';
import {Link} from 'react-router';
import MarkNotificationRead from 'app/components/elements/MarkNotificationRead';
import tt from 'counterpart';
import Immutable from "immutable";
import Callout from 'app/components/elements/Callout'
import CMCWidget from 'app/components/elements/market/CMCWidget'
import { APP_NAME, SELECT_TAGS_KEY } from 'app/client_config';
import cookie from "react-cookie";
import transaction from 'app/redux/Transaction'
import { getMetadataReliably } from 'app/utils/NormalizeProfile';

class PostsIndex extends React.Component {

    static propTypes = {
        discussions: PropTypes.object,
        accounts: PropTypes.object,
        status: PropTypes.object,
        routeParams: PropTypes.object,
        requestData: PropTypes.func,
        loading: PropTypes.bool,
        loggedIn: PropTypes.bool,
        username: PropTypes.string
    };

    static defaultProps = {
        showSpam: false,
        loading: false,
    }

    constructor() {
        super();
        this.state = {};
        this.shouldComponentUpdate = shouldComponentUpdate(this, 'PostsIndex');
        this.listRef = React.createRef();
    }

    componentDidUpdate(prevProps) {
        if (window.innerHeight && window.innerHeight > 3000 && prevProps.discussions !== this.props.discussions) {
            this.listRef.fetchIfNeeded();
        }
    }

    getPosts(order, category) {
        let select_tags = cookie.load(SELECT_TAGS_KEY);
        select_tags = typeof select_tags === 'object' ? select_tags.sort().join('/') : '';
        const topic_discussions = this.props.discussions.get(category || select_tags);
        if (!topic_discussions) return null;
        return topic_discussions.get(order);
    }

    updateSubscribe = (onSuccess) => {
        const { accounts, username, } = this.props;
        const account = accounts.get(username) ? accounts.get(username).toJS() : {};
        let metaData = account ? getMetadataReliably(account.json_metadata) : {};
        if (!metaData.profile)
            metaData.profile = {};

        let select_tags = cookie.load(SELECT_TAGS_KEY);
        metaData.profile.select_tags = typeof select_tags === 'object' ? select_tags : '';
        if (!metaData.profile.select_tags)
            delete metaData.profile.select_tags;

        this.props.updateAccount({
            json_metadata: JSON.stringify(metaData),
            account: account.name,
            errorCallback: (e) => {
                if (e !== 'Canceled') {
                    console.log('updateAccount ERROR', e);
                }
                this.setState({
                    loading: false,
                });
            },
            successCallback: () => {
                this.setState({
                    loading: false,
                });
                if (onSuccess) onSuccess();
            },
        });
    }

    loadMore = (last_post, _category, from) => {
        if (!last_post) return;
        let { accountname, } = this.props.routeParams;
        let {
            category,
            order = constants.DEFAULT_SORT_ORDER,
        } = this.props.routeParams;
        if (category === 'feed') {
            accountname = order.slice(1);
            order = 'by_feed';
        }
        if (isFetchingOrRecentlyUpdated(this.props.status, order, category)) return;
        const [ author, permlink, ] = last_post.split('/');
        this.props.requestData({ author, permlink, order, category, accountname, from, });
    };

    loadSelected = (keys) => {
        let { accountname,
            category,
            order = constants.DEFAULT_SORT_ORDER,
        } = this.props.routeParams;
        if (category === 'feed') {
            accountname = order.slice(1);
            order = 'by_feed';
        }
        // if (isFetchingOrRecentlyUpdated(this.props.status, order, category)) return;
        this.props.requestData({ order, keys, });
    };

    onShowSpam = () => {
        this.setState({showSpam: !this.state.showSpam})
    }

    render() {
        let { loggedIn, categories, has_from_search } = this.props;
        let {category, order = constants.DEFAULT_SORT_ORDER} = this.props.routeParams;
        let topics_order = order;
        let posts = [];
        let emptyText = '';
        let markNotificationRead = null;
        if (!this.props.username && (order === 'allposts' || order === 'allcomments')) {
            return <div>{tt('poststub.login')}.</div>
        }
        if (category === 'feed') {
            const account_name = order.slice(1);
            order = 'by_feed';
            topics_order = loggedIn ? 'created' : 'trending';
            posts = this.props.accounts.getIn([account_name, 'feed']);
            const isMyAccount = this.props.username === account_name;
            if (isMyAccount) {
                emptyText = <div>
                    {tt('user_profile.user_hasnt_followed_anything_yet', {name: account_name})}
                    <br /><br />
                    {tt('user_profile.if_you_recently_added_new_users_to_follow')}<br /><br />
                    <Link to="/trending">{tt('user_profile.explore_APP_NAME', {APP_NAME})}</Link><br />
                    <Link to="/welcome">{tt('submit_a_story.welcome_to_the_blockchain')}</Link>
                </div>;
                markNotificationRead = <MarkNotificationRead fields="feed" account={account_name} />
            } else {
                emptyText = <div>{tt('user_profile.user_hasnt_followed_anything_yet', {name: account_name})}</div>;
            }
        } else {
            posts = this.getPosts(order, category);
            if (posts && posts.size === 0) {
                emptyText = <div>{tt('g.no_topics_by_order_found', {order: (category ? ` #` + category : '')})}</div>;
            }
        }

        const status = this.props.status ? this.props.status.getIn([category || '', order]) : null;
        const fetching = (status && status.fetching) || this.props.loading || this.props.fetching || false;
        const {showSpam} = this.state;
        const account = this.props.username && this.props.accounts.get(this.props.username) || null
        const json_metadata = account ? account.toJS().json_metadata : {}
        const metaData = account ? getMetadataReliably(json_metadata) : {}
        const active_user = this.props.username || ''

        let promo_posts = []
        if (!has_from_search && ['created', 'responses', 'donates', 'trending'].includes(order) && posts && posts.size) {
          const slice_step = order == 'trending' ? 3 : 1
          promo_posts = posts.slice(0, slice_step)
          posts = posts.slice(slice_step)
        }

        return (
            <div className={'PostsIndex row' + (fetching ? ' fetching' : '')}>
                <div className="PostsIndex__left column small-collapse">
                    <div className="PostsIndex__topics_compact show-for-small hide-for-medium">
                        <Topics
                            categories={categories}
                            order={topics_order}
                            current={category}
                            loading={fetching}
                            loadSelected={this.loadSelected}
                            compact
                        />
                    </div>
                    { markNotificationRead }
                    {(promo_posts && promo_posts.size) ? <div>
                        <PostsList
                            posts={promo_posts ? promo_posts : Immutable.List()}
                            loading={false}
                            showSpam={showSpam}
                            />
                        <hr style={{ borderColor: 'goldenrod' }}></hr>
                      </div> : null }
                    { (!fetching && (posts && !posts.size)) ? <Callout>{emptyText}</Callout> :
                        <PostsList
                            ref={this.listRef}
                            posts={posts ? posts : Immutable.List()}
                            loading={fetching}
                            category={category}
                            loadMore={this.loadMore}
                            showSpam={showSpam || (order === 'allposts' || order === 'allcomments')}
                        /> }
                </div>
                <div className="PostsIndex__topics column shrink show-for-large">

                    <CMCWidget />

                    <Topics
                        categories={categories}
                        order={topics_order}
                        current={category}
                        loading={fetching}
                        loadSelected={this.loadSelected}
                        compact={false}
                        user={this.props.username}
                        updateSubscribe={this.updateSubscribe}
                        metaData={metaData}
                    />

                    <div className="sticky-right-ad">

                    <p align="center">
                        <a target="_blank" href={"https://coins.black/xchange_SBERRUB_to_GLS/?summ=1000&schet2=" + active_user + "&lock2=true"}><img src={require("app/assets/images/banners/coinsblack.png")} width="220" height="150" /></a>
                        <span className="strike"><a target="_blank" href="/@on0tole/pryamaya-pokupka-tokenov-golos-za-rubli-i-ne-tolko">{tt('g.more_hint')}</a></span>
                    </p>

                    <p align="center">
                        <a target="_blank" href="https://dex.golos.app"><img src={require("app/assets/images/banners/golosdex2.png")} width="220" height="160" /></a>
                        <span className="strike"><a target="_blank" href="/@graphenelab/reliz-novoi-birzhi-golos">{tt('g.more_hint')}</a></span>
                    </p>

                    {$STM_Config.show_adv_banners ?
                    (<iframe data-aa='1148471' src='//ad.a-ads.com/1148471?size=240x400' scrolling='no'
                    style={{width:'240px', height:'400px', border:'0px', padding:'0', overflow:'hidden'}}
                    allowtransparency='true' sandbox='allow-same-origin allow-scripts allow-popups' loading='lazy'></iframe>) : null}

                    </div>
                </div>
            </div>
        );
    }
}

module.exports = {
    path: ':order(/:category)',
    component: connect(
        (state) => {
            return {
                discussions: state.global.get('discussion_idx'),
                status: state.global.get('status'),
                has_from_search: state.global.get('has_from_search'),
                loading: state.app.get('loading'),
                accounts: state.global.get('accounts'),
                loggedIn: !!state.user.get('current'),
                username: state.user.getIn(['current', 'username']) || state.offchain.get('account'),
                fetching: state.global.get('fetching'),
                categories: state.global.get('tag_idx'),
            };
        },
        (dispatch) => {
            return {
                requestData: (args) => dispatch({ type: 'REQUEST_DATA', payload: args, }),
                updateAccount: ({ successCallback, errorCallback, ...operation }) => {
                    dispatch(transaction.actions.broadcastOperation({
                        type: 'account_metadata',
                        operation,
                        successCallback, errorCallback,
                    }));
                },
            };
        }
    )(PostsIndex)
};
