import React from 'react';
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom';
import {connect} from 'react-redux';
import { browserHistory } from 'react-router';
import tt from 'counterpart';
import { LinkWithDropdown } from 'react-foundation-components/lib/global/dropdown';

import Icon from 'app/components/elements/Icon';
import user from 'app/redux/User';
import Userpic from 'app/components/elements/Userpic';
import VerticalMenu from 'app/components/elements/VerticalMenu';
import LocaleSelect from 'app/components/elements/LocaleSelect';
import LoadingIndicator from 'app/components/elements/LoadingIndicator';
import NotifiCounter from 'app/components/elements/NotifiCounter';
import { LIQUID_TICKER, DEBT_TICKER } from 'app/client_config';
import LocalizedCurrency from 'app/components/elements/LocalizedCurrency';
import { openAppSettings } from 'app/components/pages/app/AppSettings'
import { vestsToSteem, toAsset } from 'app/utils/StateFunctions';
import { authRegisterUrl, } from 'app/utils/AuthApiClient';
import { msgsHost, msgsLink, } from 'app/utils/ExtLinkUtils';
import { walletUrl, walletTarget } from 'app/utils/walletUtils'

const defaultNavigate = (e) => {
    if (e.metaKey || e.ctrlKey) {
        // prevent breaking anchor tags
    } else {
        e.preventDefault();
    }
    const a = e.target.nodeName.toLowerCase() === 'a' ? e.target : e.target.parentNode;
    alert(window._router)
    alert(window._router.navigate)
    window._router.navigate('/annemarie');
    //browserHistory.push(a.pathname + a.search + a.hash);
};

const calculateEstimateOutput = ({ account, price_per_golos, savings_withdraws, globalprops }) => {
  if (!account) return 0;

  // Sum savings withrawals
  if (savings_withdraws) {
    savings_withdraws.forEach(withdraw => {
      const [amount, asset] = withdraw.get('amount').split(' ');
    })
  }

  const total_sbd = 0 
    + parseFloat(toAsset(account.get('sbd_balance')).amount)
    + parseFloat(toAsset(account.get('market_sbd_balance')).amount)
    + parseFloat(toAsset(account.get('savings_sbd_balance')).amount)

  const total_steem = 0
    + parseFloat(toAsset(account.get('balance')).amount)
    + parseFloat(toAsset(account.get('savings_balance')).amount)
    + parseFloat(toAsset(account.get('tip_balance')).amount)
    + parseFloat(toAsset(account.get('market_balance')).amount)
    + parseFloat(vestsToSteem(account.get('vesting_shares'), globalprops.toJS()))

  return Number(((total_steem * price_per_golos) + total_sbd).toFixed(2) );
}

function TopRightMenu({account, savings_withdraws, price_per_golos, globalprops, username, showLogin, goChangeAccount, loggedIn, vertical, navigate, probablyLoggedIn, location, locationQueryParams, toggleNightmode,
    hideOrders, hideOrdersMe, }) {
    if (loggedIn) {
        hideOrders = hideOrdersMe
    }
    const APP_NAME = tt('g.APP_NAME');
    const mcn = 'menu' + (vertical ? ' vertical show-for-small-only' : '');
    const mcl = vertical ? '' : ' sub-menu';
    const lcn = vertical ? '' : 'show-for-large';
    const nav = navigate || defaultNavigate;
    const topbutton = <li className={lcn + ' submit-story'}>
        <Link to='/services' className='button small topbutton'>
            <Icon name="new/monitor" size="0_95x" />{tt('g.topbutton')}
        </Link>
    </li>;
    const submitStory = (vertical || !hideOrders) && <li className={'submit-story'}>
        <a href="/submit" onClick={nav} className={'button small topbutton alert'}>
            <Icon name="new/add" size="0_95x" />{tt('g.submit_a_story')}
        </a>
    </li>;
    const submitStoryPencil = hideOrders && <li className="submit-story-pencil">
        <Link to="/submit" className="button small alert">
            <Icon name="new/add" size="0_95x" />
        </Link>
    </li>;
    const feedLink = `/@${username}/feed`;
    const repliesLink = `/@${username}/recent-replies`;
    const discussionsLink = `/@${username}/discussions`
    const walletLink = walletUrl(`/@${username}/transfers`)
    const settingsLink = `/@${username}/settings`;
    const accountLink = `/@${username}`;
    const mentionsLink = `/@${username}/mentions`;
    const donatesLink = walletUrl(`/@${username}/donates-to`)
    const messagesLink = msgsHost() ? msgsLink() : '';
    const ordersLink = walletUrl(`/@${username}/filled-orders`)

    const faqItem = (vertical || !hideOrders) && <li>
        <Link to="/faq" title={tt('navigation.faq')}><Icon name="info_o" size="1_5x" />
        </Link>
      </li>
    ;

    const searchItem = (vertical || !hideOrders) && <li>
        <Link to="/search" title={tt('navigation.search')}><Icon name="new/search" size="1_25x" />
        </Link>
      </li>
    ;

    let invite = username;
    if (process.env.BROWSER) {
        if (invite) {
            localStorage.setItem('invite', invite);
        } else {
            invite = localStorage.getItem('invite');
        }
    }

    const registerUrl = authRegisterUrl() + (invite ? ('?invite=' + invite) : '');

    const additional_menu = []
    if (!loggedIn && hideOrders) {
        additional_menu.push(
            { link: '/login.html', onClick: showLogin, value: tt('g.login') },
            { link: registerUrl,
                onClick: (e) => {
                    e.preventDefault();
                    window.location.href = registerUrl;
                },
                value: tt('g.sign_up') }
        )
    }
    additional_menu.push(
        { link: '#', onClick: toggleNightmode, icon: 'editor/eye', value: tt('g.night_mode') },
        { link: walletUrl('/rating'), target: walletTarget(), icon: 'trade', value: tt("navigation.market") },
        { link: '/services', icon: 'new/monitor', value: tt("navigation.services") },
        { link: '/search', icon: 'new/search', value: tt("navigation.search") },
        { link: walletUrl('/exchanges'), target: walletTarget(), icon: 'editor/coin', value: tt("navigation.buy_sell") },
        { link: walletUrl('/~witnesses'), target: walletTarget(), icon: 'new/like', value: tt("navigation.witnesses") },
        { link: walletUrl('/workers'), target: walletTarget(), icon: 'voters', value: tt("navigation.workers") },
        { link: 'https://wiki.golos.id/', icon: 'new/wikipedia', value: tt("navigation.wiki"), target: 'blank' },
        { link: 'https://explorer.golos.id/', icon: 'cog', value: tt("navigation.explorer"), target: 'blank' } 
    );
    if (!loggedIn && process.env.MOBILE_APP) {
        const openSettings = (e) => {
            e.preventDefault()
            openAppSettings()
        }
        additional_menu.push(
            { link: '#', onClick: openSettings, icon: 'new/setting', value: tt("g.settings"), } 
        )
    }
    const navAdditional = <LinkWithDropdown
        closeOnClickOutside
        dropdownPosition="bottom"
        dropdownAlignment="right"
        dropdownContent={<VerticalMenu className={'VerticalMenu_nav-additional'} items={additional_menu} />}
    >
        {!vertical && <li>
            <a href="#" onClick={e => e.preventDefault()}>
                <Icon name="new/more" />
            </a>
        </li>}
    </LinkWithDropdown>;

    const estimateOutputAmount = calculateEstimateOutput({ account, price_per_golos, savings_withdraws, globalprops })
    const estimateOutput = <LocalizedCurrency amount={estimateOutputAmount} />

    if (loggedIn) { // change back to if(username) after bug fix:  Clicking on Login does not cause drop-down to close #TEMP!
        let user_menu = [
            {link: feedLink, icon: 'new/home', value: tt('g.feed'), addon: <NotifiCounter fields="feed" />},
            {link: accountLink, icon: 'new/blogging', value: tt('g.blog'), addon: <NotifiCounter fields="new_sponsor,sponsor_inactive,referral" />},
            {link: repliesLink, icon: 'new/answer', value: tt('g.replies'), addon: <NotifiCounter fields="comment_reply" />},
            {link: discussionsLink, icon: 'new/bell', value: tt('g.discussions'), addon: <NotifiCounter fields="subscriptions" />},
            {link: mentionsLink, icon: 'new/mention', value: tt('g.mentions'), addon: <NotifiCounter fields="mention" />},
            {link: walletLink, target: walletTarget(), icon: 'new/wallet', value: tt('g.wallet'), addon: <NotifiCounter fields="send,receive,fill_order,delegate_vs,nft_receive,nft_token_sold,nft_buy_offer" />},
            {link: donatesLink, target: walletTarget(), icon: 'hf/hf8', value: tt('g.rewards'), addon: <NotifiCounter fields="donate,donate_msgs" />},
            (messagesLink ?
                {link: messagesLink, icon: 'new/envelope', value: tt('g.messages'), target: '_blank', addon: <NotifiCounter fields="message" />} :
                null),
            {link: settingsLink, icon: 'new/setting', value: tt('g.settings')},            
            loggedIn ?
                {link: '#', icon: 'new/logout', onClick: goChangeAccount, value: tt('g.change_acc')} :
                {link: '#', onClick: showLogin, value: tt('g.login')}
        ];

        const voting_power_percent = account.get('voting_power') / 100

        return (
            <ul className={mcn + mcl}>
                {(vertical || !hideOrders) && <span><LocaleSelect /></span>}
                {faqItem}
                {searchItem}
                {!hideOrders && <li className="delim" />}
                {topbutton}
                {submitStory}
                {!vertical && submitStoryPencil}
                {!hideOrders && <li className="delim" />}
                <LinkWithDropdown
                    closeOnClickOutside
                    dropdownPosition="bottom"
                    dropdownAlignment="bottom"
                    dropdownContent={<VerticalMenu className={'VerticalMenu_nav-profile'} items={user_menu} title={estimateOutput} />}
                >
                    {!vertical && <li className={'Header__profile'}>
                        <a href={accountLink} title={username} onClick={e => e.preventDefault()}>
                            <Userpic account={username} showProgress={true} votingPower={account.get('voting_power')} progressClass="hide-for-large" />
                            <div className={'NavProfile show-for-large'}>
                                <div className={'NavProfile__name'}>{username}</div>
                                <div className={'NavProfile__golos'}>
                                    {tt('g.voting_capacity')}: <span className={'NavProfile__golos-percent'}>{voting_power_percent}%</span>
                                </div>
                                <div className={'NavProfile__progress'} title={`${voting_power_percent}%`}>
                                    <div className={'NavProfile__progress-percent'} style={{ width: `${voting_power_percent}%` }} />
                                </div>
                            </div>
                        </a>
                        <div className="TopRightMenu__notificounter"><NotifiCounter fields="feed,subscriptions,send,receive,delegate_vs,donate,donate_msgs,message,fill_order,comment_reply,mention,new_sponsor,sponsor_inactive,nft_receive,nft_token_sold,nft_buy_offer,referral" /></div>
                    </li>}
                </LinkWithDropdown>
                {navAdditional}
            </ul>
        );
    }

    return (
        <ul className={mcn + mcl}>
            <LocaleSelect />
            {faqItem}
            {searchItem}
            <li className="delim show-for-medium" />
            {!probablyLoggedIn && (vertical || !hideOrders) && <li>
              <a href="/login.html" onClick={showLogin} className={!vertical && 'button small violet hollow'}>{tt('g.login')}</a>
            </li>}
            {!probablyLoggedIn && (vertical || !hideOrders) && <li>
              <a href={registerUrl} className={!vertical && 'button small alert'}>{tt('g.sign_up')}</a>
            </li>}
            {probablyLoggedIn && <li className={lcn}>
              <LoadingIndicator type="circle" inline />
            </li>}
            {navAdditional}
        </ul>
    );
}

TopRightMenu.propTypes = {
    username: PropTypes.string,
    loggedIn: PropTypes.bool,
    probablyLoggedIn: PropTypes.bool,
    showLogin: PropTypes.func.isRequired,
    goChangeAccount: PropTypes.func.isRequired,
    vertical: PropTypes.bool,
    navigate: PropTypes.func,
};

export default connect(
    state => {
        if (!process.env.BROWSER) {
            return {
                username: null,
                loggedIn: false,
                probablyLoggedIn: !!state.offchain.get('account')
            }
        }
        const username = state.user.getIn(['current', 'username']);
        const account  = state.global.getIn(['accounts', username]);
        const loggedIn = !!username;

        const savings_withdraws = state.user.get('savings_withdraws');
        let price_per_golos = undefined;
        const feed_price = state.global.get('feed_price');
        if(feed_price && feed_price.has('base') && feed_price.has('quote')) {
            const {base, quote} = feed_price.toJS()
            if(/ GBG$/.test(base) && / GOLOS$/.test(quote))
                price_per_golos = parseFloat(base.split(' ')[0]) / parseFloat(quote.split(' ')[0])
        }
        const globalprops = state.global.get('props');

        return {
            account,
            username,
            loggedIn,
            savings_withdraws,
            price_per_golos,
            globalprops,
            probablyLoggedIn: false
        }
    },
    dispatch => ({
        showLogin: e => {
            if (e) e.preventDefault();
            dispatch(user.actions.showLogin())
        },
        toggleNightmode: (e) => {
            if (e) e.preventDefault();
            dispatch(user.actions.toggleNightmode());
        },
        goChangeAccount: (e) => {
            if (e) e.preventDefault()
            dispatch(user.actions.showChangeAccount())
        },
    })
)(TopRightMenu);
