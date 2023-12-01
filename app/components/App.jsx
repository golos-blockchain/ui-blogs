import React from 'react';
import golos from 'golos-lib-js';
import { key_utils } from 'golos-lib-js/lib/auth/ecc';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Toaster } from 'react-hot-toast'
import cn from 'classnames';
import tt from 'counterpart';
import CloseButton from 'react-foundation-components/lib/global/close-button';
import { createGlobalStyle } from 'styled-components'

import AppPropTypes from 'app/utils/AppPropTypes';
import Header from 'app/components/modules/Header';
import Footer from 'app/components/modules/Footer';
import NewsPopups from 'app/components/elements/NewsPopups'
import URLLoader from 'app/components/elements/app/URLLoader';
import TooltipManager from 'app/components/elements/common/TooltipManager';
import user from 'app/redux/User';
import g from 'app/redux/GlobalReducer';
import { Link } from 'react-router';
import resolveRoute from 'app/ResolveRoute';
import Dialogs from '@modules/Dialogs';
import Modals from '@modules/Modals';
import Icon from '@elements/Icon';
import ScrollButton from '@elements/ScrollButton';
import MiniHeader from '@modules/MiniHeader';
import PageViewsCounter from '@elements/PageViewsCounter';
import ChainFailure from 'app/components/elements/ChainFailure'
import DialogManager from 'app/components/elements/common/DialogManager';
import NotifyPolling from 'app/components/elements/NotifyPolling'
import { init as initAnchorHelper } from 'app/utils/anchorHelper';
import { authRegisterUrl, } from 'app/utils/AuthApiClient';
import { APP_ICON, VEST_TICKER, } from 'app/client_config';
import session from 'app/utils/session'
import { loadGrayHideSettings } from 'app/utils/ContentAccess'

const GlobalStyle = createGlobalStyle`
    body {
        fill: currentColor;
    }
`;

const availableDomains = [
    'golos.id',
    'golos.in',
    'golos.today',
    'golos.app',
    'gls.exchange',
    'golostalk.com',
    'prizmtalk.com',
    'gph.ai',
    'dpos.space',
    'pisolog.net',
    'rudex.org',
    'github.com',
    't.me',
    'twitter.com',
    'vk.com',
    'coinmarketcap.com',
    'sharpay.io',
    'golos.chatbro.com',
    'yandex.ru',
    'google.com'
];

class App extends React.Component {
    state = {
        showCallout: true,
        showBanner: true,
        expandCallout: false,
    };

    shouldComponentUpdate(nextProps, nextState) {
        const p = this.props;
        const n = nextProps;
        return (
            p.location !== n.location ||
            p.new_visitor !== n.new_visitor ||
            p.flash !== n.flash ||
            this.state !== nextState ||
            p.nightmodeEnabled !== n.nightmodeEnabled
        );
    }

    loadDownvotedPrefs = () => {
        try {
            const data = session.load()
            if (data.currentName) {
                const pref = loadGrayHideSettings(data.currentName)
                if (pref === 'gray_only') {
                    window.NO_HIDE = true
                } else if (pref === 'no_gray') {
                    window.NO_HIDE = true
                    window.NO_GRAY = true
                }
            }
        } catch (err) {
            console.error('loadDownvotedPrefs', err)
        }
    }

    constructor(props) {
        super(props)
        if (process.env.BROWSER) {
            this.loadDownvotedPrefs()
        }
    }

    componentDidMount() {
        if (process.env.BROWSER) {
            console.log('ui-blogs version:', $STM_Config.ui_version);
        }

        const { nightmodeEnabled } = this.props;
        this.toggleBodyNightmode(nightmodeEnabled);

        if (process.env.BROWSER) {
            localStorage.removeItem('autopost') // July 14 '16 compromise, renamed to autopost2
        }

        this.props.loginUser();
        this.props.loadExchangeRates();

        window.addEventListener('storage', this.checkLogin);
        if (process.env.BROWSER) {
            window.addEventListener('click', this.checkLeaveGolos);
        }
        // setTimeout(() => this.setState({showCallout: false}), 15000);

        if (process.env.BROWSER) {
            initAnchorHelper();
        }
    }

    toggleBodyNightmode(nightmodeEnabled) {
        if (nightmodeEnabled) {
            document.body.classList.remove('theme-light');
            document.body.classList.add('theme-dark');
        } else {
            document.body.classList.remove('theme-dark');
            document.body.classList.add('theme-light');
        }
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        const { nightmodeEnabled } = nextProps;
        this.toggleBodyNightmode(nightmodeEnabled);
    }

    UNSAFE_componentWillMount() {
        if (process.env.BROWSER) {
            window.IS_MOBILE =
                /android|iphone/i.test(navigator.userAgent) ||
                window.innerWidth < 765;

            window.INIT_TIMESSTAMP = Date.now();
        }
    }

    componentWillUnmount() {
        window.removeEventListener('storage', this.checkLogin);
        if (process.env.BROWSER) {
            window.removeEventListener('click', this.checkLeaveGolos);
        }
    }

    componentDidUpdate(nextProps) {
        // setTimeout(() => this.setState({showCallout: false}), 15000);
        if (nextProps.location.pathname !== this.props.location.pathname) {
            this.setState({ showBanner: false, showCallout: false });
        }
    }

    checkLogin = event => {
        if (event.key === 'autopost2') {
            if (!event.newValue) this.props.logoutUser();
            else if (!event.oldValue || event.oldValue !== event.newValue)
                this.props.loginUser();
        }
    };

    checkLeaveGolos = e => {
        const a = e.target.closest('a');

        if (
            a &&
            a.hostname &&
            a.hostname !== window.location.hostname &&
            !availableDomains.some(domain =>
                new RegExp(`${domain}$`).test(a.hostname)
            )
        ) {
            e.stopPropagation();
            e.preventDefault();

            const win = window.open(`/leave_page?${a.href}`, '_blank');
            win.focus();
        }
    };

    toggleOffCanvasMenu(e) {
        e.preventDefault();
        // this.setState({open: this.state.open ? null : 'left'});
        this.refs.side_panel.show();
    }

    handleClose = () => this.setState({ open: null });

    // navigate = (e) => {
    //     const a = e.target.nodeName.toLowerCase() === 'a' ? e.target : e.target.parentNode;
    //     if (a.host !== window.location.host) return;
    //     e.preventDefault();
    //     browserHistory.push(a.pathname + a.search + a.hash);
    // };

    onEntropyEvent(e) {
        if (e.type === 'mousemove')
            key_utils.addEntropy(e.pageX, e.pageY, e.screenX, e.screenY);
        else console.log('onEntropyEvent Unknown', e.type, e);
    }

    isShowInfoBox(notifySite) {
        if (process.env.BROWSER) {
            if (!localStorage.getItem('infobox')) {
                localStorage.setItem('infobox', JSON.stringify({
                    id: notifySite.id,
                    show: true,
                }));
                return true;
            } else {
                const value = JSON.parse(localStorage.getItem('infobox'));
                if (value.id === notifySite.id) {
                    return value.show;
                } else {
                    return true
                }
            }
        }
        return false;
    }

    closeBox(notifySite) {
        const infoBox = {
            id: notifySite.id,
            show: false,
        }
        localStorage.setItem('infobox', JSON.stringify(infoBox));
    }

    render() {
        const {
            location,
            params,
            children,
            flash,
            new_visitor,
            nightmodeEnabled
        } = this.props;

        const route = resolveRoute(location.pathname);
        const lp = false; //location.pathname === '/';
        let miniHeader = false;
        const params_keys = Object.keys(params);
        const ip =
            location.pathname === '/' ||
            (params_keys.length === 2 &&
                params_keys[0] === 'order' &&
                params_keys[1] === 'category');
        const alert = this.props.error || flash.get('alert');
        const warning = flash.get('warning');
        const success = flash.get('success');
        let callout = null;
        const notifyLink = $STM_Config.add_notify_site.link;
        const notifyTitle = $STM_Config.add_notify_site.title;
        const showInfoBox = $STM_Config.add_notify_site.show && this.isShowInfoBox($STM_Config.add_notify_site);

        if (this.state.showCallout && (alert || warning || success)) {
            callout = (
                <div className="App__announcement row">
                    <div className="column">
                        <div className="callout">
                            <CloseButton
                                onClick={() =>
                                    this.setState({ showCallout: false })
                                }
                            />
                            <p>{alert || warning || success}</p>
                        </div>
                    </div>
                </div>
            );
        } else if (this.state.showCallout && showInfoBox) {
            callout = (
                <div className="App__announcement row">
                    <div className="column">
                        <div align="center" className="callout" style={{backgroundColor: '#1b519a', color: 'white'}}>
                            <CloseButton
                                onClick={() => {
                                    this.setState({ showCallout: false });
                                    this.closeBox($STM_Config.add_notify_site);
                                }}
                            />
                            {$STM_Config.add_notify_site.new_tab ? 
                                <a className="link" href={notifyLink} target='_blank'>
                                    <Icon className="logo-icon" name={APP_ICON} /> {notifyTitle}
                                </a>
                                :
                                <Link className="link" to={notifyLink}>
                                    <Icon className="logo-icon" name={APP_ICON} /> {notifyTitle}
                                </Link>}
                        </div>
                    </div>
                </div>
            );
        }

        let invite = location.query.invite;
        if (process.env.BROWSER) {
            if (invite) {
                localStorage.setItem('invite', invite);
            } else {
                invite = localStorage.getItem('invite');
            }
        }

        let welcome_screen = null;
        if (ip && new_visitor && this.state.showBanner) {
            welcome_screen = (
                <div className="welcomeWrapper">
                    <div className="welcomeBanner">
                        <CloseButton
                            onClick={() => this.setState({ showBanner: false })}
                        />
                        <div className="text-center">
                            <br />
                            <h2>
                                {tt('submit_a_story.welcome_to_the_blockchain')}
                            </h2>
                            <h4>
                                {tt(
                                    'submit_a_story.your_voice_is_worth_something'
                                )}
                            </h4>
                            <br />
                            <a className="button" href={authRegisterUrl() + (invite ? ("?invite=" + invite) : "")}>
                                {' '}
                                <b>{tt('navigation.sign_up')}</b>{' '}
                            </a>
                            &nbsp; &nbsp; &nbsp;
                            <a
                                className="button hollow uppercase"
                                href="/start"
                                onClick={this.learnMore}
                            >
                                {' '}
                                <b>{tt('submit_a_story.learn_more')}</b>{' '}
                            </a>
                            <br />
                        </div>
                    </div>
                </div>
            );
        }

        const themeClass = nightmodeEnabled ? ' theme-dark' : ' theme-light';

        const isApp = process.env.IS_APP && location.pathname.startsWith('/__app_')

        const noHeader = isApp
        const noFooter = isApp || location.pathname.startsWith('/submit')

        return (
            <div
                className={
                    'App' + ' ' + themeClass +
                    (lp ? ' LP' : '') +
                    (ip ? ' index-page' : '') +
                    (miniHeader ? ' mini-' : '') +
                    (noHeader ? ' no-header' : '')
                }
                onMouseMove={this.onEntropyEvent}
            >
                {process.env.BROWSER ? <Toaster position='bottom-left' /> : null}
                {noHeader ? null : (miniHeader ? <MiniHeader /> : <Header />)}
                <div className={cn('App__content' +
                    (noHeader ? ' no-header' : ''), {
                    'App__content_hide-sub-menu': route.hideSubMenu,
                })}>
                    {welcome_screen}
                    {callout}
                    <ChainFailure />
                    {children}
                    {noFooter ? null : <Footer />}
                    <NewsPopups />
                    <ScrollButton />
                </div>
                <Dialogs />
                <Modals />
                <DialogManager />
                {process.env.BROWSER ? <TooltipManager /> : null}
                <PageViewsCounter hidden/>
                <GlobalStyle />
                {process.env.IS_APP ? <URLLoader /> : null}
                <NotifyPolling />
            </div>

        );
    }
}

App.propTypes = {
    error: PropTypes.string,
    children: AppPropTypes.Children,
    location: PropTypes.object,
    loginUser: PropTypes.func.isRequired,
    logoutUser: PropTypes.func.isRequired,
    depositSteem: PropTypes.func.isRequired,
    nightmodeEnabled: PropTypes.bool
};

export default connect(
    state => {
        let nightmodeEnabled = process.env.BROWSER ? localStorage.getItem('nightmodeEnabled') == 'true' || false : false

        return {
            error: state.app.get('error'),
            flash: state.offchain.get('flash'),
            new_visitor:
                !state.user.get('current') &&
                !state.offchain.get('account') &&
                state.offchain.get('new_visit'),
            nightmodeEnabled: nightmodeEnabled
        };
    },
    dispatch => ({
        loginUser: () => {
            dispatch(user.actions.usernamePasswordLogin())
        },
        logoutUser: () => dispatch(user.actions.logout()),
        depositSteem: () => {
            dispatch(
                g.actions.showDialog({
                    name: 'blocktrades_deposit',
                    params: { outputCoinType: VEST_TICKER },
                })
            );
        },
        loadExchangeRates: () => {
            dispatch(g.actions.fetchExchangeRates());
        },
    })
)(App);
