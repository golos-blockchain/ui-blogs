import React from 'react';
import PropTypes from 'prop-types'
import { Link } from 'react-router';
import {connect} from 'react-redux';
import TopRightMenu from 'app/components/modules/TopRightMenu';
import Icon from 'app/components/elements/Icon.jsx';
import resolveRoute from 'app/ResolveRoute';
import DropdownMenu from 'app/components/elements/DropdownMenu';
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate';
import HorizontalMenu from 'app/components/elements/HorizontalMenu';
import normalizeProfile from 'app/utils/NormalizeProfile';
import tt from 'counterpart';
import {detransliterate, capitalizeFirstLetter} from 'app/utils/ParsersAndFormatters';
import {APP_NAME_UP, APP_ICON, SEO_TITLE} from 'app/client_config';

function sortOrderToLink(so, topic, account) {
    // to prevent probmes check if topic is not the same as account name
    if ('@' + account == topic) topic = ''
    if (so === 'home') return '/@' + account + '/feed';
    if (topic) return `/${so}/${topic}`;
    return `/${so}`;
}

class Header extends React.Component {
    static propTypes = {
        location: PropTypes.object.isRequired,
        current_account_name: PropTypes.string,
        account_meta: PropTypes.object
    };

    constructor() {
        super();
        this.state = {subheader_hidden: false}
        this.shouldComponentUpdate = shouldComponentUpdate(this, 'Header');
        this.hideSubheader = this.hideSubheader.bind(this);
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        if (nextProps.location.pathname !== this.props.location.pathname) {
            const route = resolveRoute(nextProps.location.pathname);
            if (route && route.page === 'PostsIndex' && route.params && route.params.length > 0) {
                const sort_order = route.params[0] !== 'home' ? route.params[0] : null;
                if (sort_order) window.last_sort_order = this.last_sort_order = sort_order;
            }
        }
    }

    hideSubheader() {
        const subheader_hidden = this.state.subheader_hidden;
        const y = window.scrollY >= 0 ? window.scrollY : document.documentElement.scrollTop;
        if (y === this.prevScrollY) return;
        if (y < 5) {
            this.setState({subheader_hidden: false});
        } else if (y > this.prevScrollY) {
            if (!subheader_hidden) this.setState({subheader_hidden: true})
        } else {
            if (subheader_hidden) this.setState({subheader_hidden: false})
        }
        this.prevScrollY = y;
    }

    componentDidMount() {
        window.addEventListener('scroll', this.hideSubheader);
    }

    componentWillUnmount() {
        window.removeEventListener('scroll', this.hideSubheader);
    }

    render() {
        const route = resolveRoute(this.props.location.pathname);
        const current_account_name =  this.props.current_account_name;
        let home_account = false;
        let page_title = route.page;

        let sort_order = '';
        let topic = '';
        let topic_original_link = '';
        let user_name = null;
        let page_name = null;

        if (route.page === 'PostsIndex') {
            sort_order = route.params[0] || '';
            if (sort_order === 'home') {
                page_title = tt('header_jsx.home')
                const account_name = route.params[1];
                if (current_account_name && account_name.indexOf(current_account_name) === 1)
                    home_account = true;
            } else {
                const type = tt('g.posts');
                const topic = (route.params.length > 1 ? detransliterate(route.params[1]) + ' ' : '')
                topic_original_link = route.params[1]
                let prefix = route.params[0];
                if(prefix == 'created') prefix = tt('header_jsx.created')
                if(prefix == 'responses') prefix = tt('header_jsx.responses')
                if(prefix == 'trending') prefix = tt('header_jsx.trending')
                if(prefix == 'donates') prefix = tt('header_jsx.donates')
                if(prefix == 'forums') prefix = tt('header_jsx.forums')
                if(prefix == 'allposts') {
                    page_title = tt('header_jsx.all_posts');
                } else if(prefix == 'allcomments') {
                    page_title = tt('header_jsx.all_comments');
                } else {
                    page_title = `${prefix} ${topic}${type}`;
                }
            }
        } else if (route.page === 'Post') {
            sort_order = '';
            topic = route.params[0];
        } else if (route.page == 'SubmitPost') {
            page_title = tt('header_jsx.create_a_post');
        } else if (route.page == 'ChangePassword') {
            page_title = tt('header_jsx.change_account_password');
        } else if (route.page === 'MinusedAccounts') {
            page_title = tt('minused_accounts_jsx.title');
        } else if (route.page === 'UserProfile') {
            user_name = route.params[0].slice(1);
            const acct_meta = this.props.account_meta.getIn([user_name]);
            const name = acct_meta ? normalizeProfile(acct_meta.toJS()).name : null;
            const user_title = name ? `${name} (@${user_name})` : user_name;
            page_title = user_title;
            if(route.params[1] === "followers"){
                page_title = tt('header_jsx.people_following') + " " + user_title;
            }
            if(route.params[1] === "followed"){
                page_title = tt('header_jsx.people_followed_by') + " " + user_title;
            }
            if(route.params[1] === "curation-rewards"){
                page_title = tt('header_jsx.curation_rewards_by') + " " + user_title;
            }
            if(route.params[1] === "author-rewards"){
                page_title = tt('header_jsx.author_rewards_by') + " " + user_title;
            }
            if(route.params[1] === "donates-from"){
                page_title = tt('header_jsx.donates_from') + " " + user_title;
            }
            if(route.params[1] === "donates-to"){
                page_title = tt('header_jsx.donates_to') + " " + user_title;
            }
            if(route.params[1] === "recent-replies"){
                page_title = tt('header_jsx.replies_to') + " " + user_title;
            }
            // @user/"posts" is deprecated in favor of "comments" as of oct-2016 (#443)
            if(route.params[1] === "posts" || route.params[1] === "comments"){
                page_title = tt('header_jsx.comments_by') + " " + user_title;
            }
        } else if (route.page === 'ConvertAssetsLoader') {
            page_title = tt('g.convert_assets')
        } else {
            page_name = ''; //page_title = route.page.replace( /([a-z])([A-Z])/g, '$1 $2' ).toLowerCase();
        }

        // Format first letter of all titles and lowercase user name
        if (route.page !== 'UserProfile') {
            page_title = page_title.charAt(0).toUpperCase() + page_title.slice(1);
        }

        if (process.env.BROWSER && (route.page !== 'Post' && route.page !== 'PostNoCategory')) document.title = page_title + ' | ' + SEO_TITLE;

        const logo_link = route.params && route.params.length > 1 && this.last_sort_order ? '/' + this.last_sort_order : (current_account_name ? `/@${current_account_name}/feed` : '/');
        let topic_link = topic ? <Link to={`/${this.last_sort_order || 'hot'}/${topic_original_link}`}>{detransliterate(topic)}</Link> : null;

        const sort_orders = [
            ['created', tt('g.new')],
            ['responses', tt('main_menu.discussion')],
            ['trending', tt('main_menu.trending')],
            ['donates', tt('main_menu.donates')],
            ['forums', tt('main_menu.forums')]
        ];
        if (current_account_name) sort_orders.unshift(['home', tt('header_jsx.home')]);
        const sort_order_menu = sort_orders.filter(so => so[0] !== sort_order).map(so => ({link: sortOrderToLink(so[0], topic_original_link, current_account_name), value: capitalizeFirstLetter(so[1])}));
        const selected_sort_order = sort_orders.find(so => so[0] === sort_order);

        const sort_orders_horizontal = [
            ['created', tt('g.new')],
            ['responses', tt('main_menu.discussion')],
            ['trending', tt('main_menu.trending')],
            ['donates', tt('main_menu.donates')],
            ['forums', tt('main_menu.forums')]
        ];
        if (current_account_name) sort_orders_horizontal.unshift(['home', tt('header_jsx.home')]);
        const sort_order_menu_horizontal = sort_orders_horizontal.map(so => {
                let active = (so[0] === sort_order);
                if (so[0] === 'home' && sort_order === 'home' && !home_account) active = false;
                return {link: sortOrderToLink(so[0], topic_original_link, current_account_name), value: so[1], active};
            });

        return (
            <header className="Header noPrint">
                <div className="Header__top header">
                    <div className="row align-middle">
                        <div className="columns">
                            <ul className="menu">
                                <li className="Header__top-logo">
                                    <Link to={logo_link}>
                                        <Icon name={APP_ICON} size="2x" />
                                        {/* <img src={require("app/assets/images/golos-NG.png")} height="40" width="44" /> */}
                                    </Link>
                                </li>
                                <li className="Header__top-steemit show-for-large noPrint">
                                    <Link to={logo_link}>{APP_NAME_UP}<span className="beta">blockchain</span></Link>
                                </li>
                                {selected_sort_order && <DropdownMenu className="Header__sort-order-menu show-for-small-only" items={sort_order_menu} selected={selected_sort_order[1]} el="li" />}
                            </ul>
                        </div>
                        <div className="columns shrink">
                            <TopRightMenu {...this.props} />
                        </div>
                    </div>
                </div>
                {route.hideSubMenu ? null :
                    <div className={'Header__sub-nav show-for-medium hide-for-small ' + (this.state.subheader_hidden ? ' hidden' : '')}>
                        <div className="row">
                            <div className="columns">
                                <span className="question"><a target="_blank" rel="noopener noreferrer" href="https://golos.chatbro.com"><Icon name="new/telegram" />&nbsp;&nbsp;{tt('g.to_ask')}</a></span>
                                <HorizontalMenu items={sort_order_menu_horizontal} />
                            </div>
                        </div>
                    </div>
                }
            </header>
        );
    }
}

export {Header as _Header_};

export default connect(
    state => {
        const current_user = state.user.get('current');
        const account_user = state.global.get('accounts');
        const current_account_name = current_user ? current_user.get('username') : state.offchain.get('account');
        const { routing: {locationBeforeTransitions: { query }}} = state;
        return {
            location: state.app.get('location'),
            locationQueryParams: query,
            current_account_name,
            account_meta: account_user,
        }
    }
)(Header);
