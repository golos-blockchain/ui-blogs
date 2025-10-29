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

import Header from 'app/components/modules/Header';
import Footer from 'app/components/modules/Footer';
import NewsPopups from 'app/components/elements/NewsPopups'
import URLLoader from 'app/components/elements/app/URLLoader';
import TooltipManager from 'app/components/elements/common/TooltipManager';
import user from 'app/redux/User';
import g from 'app/redux/GlobalReducer';
import PushNotificationSaga from 'app/redux/services/PushNotificationSaga'
import { Outlet } from 'react-router';
import { Link } from 'react-router-dom';
import resolveRoute from 'app/ResolveRoute';
import Dialogs from '@modules/Dialogs';
import Modals from '@modules/Modals';
import Icon from '@elements/Icon';
import ScrollButton from '@elements/ScrollButton';
import MiniHeader from '@modules/MiniHeader';
import PageViewsCounter from '@elements/PageViewsCounter';
import ChainFailure from 'app/components/elements/ChainFailure'
import DialogManager from 'app/components/elements/common/DialogManager';
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import NotifyPolling from 'app/components/elements/NotifyPolling'
import AppSettings, { openAppSettings } from 'app/components/pages/app/AppSettings'
import { init as initAnchorHelper } from 'app/utils/anchorHelper';
import { authRegisterUrl, } from 'app/utils/AuthApiClient';
import { fixRouteIfApp, reloadLocation, backRouteFix, } from 'app/utils/app/RoutingUtils'
import { getShortcutIntent, onShortcutIntent } from 'app/utils/app/ShortcutUtils'
import { APP_ICON, VEST_TICKER, } from 'app/client_config';
import session from 'app/utils/session'
import { loadGrayHideSettings } from 'app/utils/ContentAccess'
import LocationWatch from 'app/utils/LocationWatch'
import { withRouter, NavigateHelper } from 'app/utils/routing'
import { withScreenSize } from 'app/utils/ScreenSize'
import libInfo from 'app/JsLibHash.json'

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
            p.router.location !== n.router.location ||
            p.new_visitor !== n.new_visitor ||
            p.flash !== n.flash ||
            this.state !== nextState ||
            this.state.can_render !== nextState.can_render ||
            p.nightmodeEnabled !== n.nightmodeEnabled ||
            p.hideOrdersMe !== n.hideOrdersMe ||
            p.hideOrders !== n.hideOrders
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
            if (window.location.hash === '#app-settings') {
                this.appSettings = true
            }
            window.appMounted = true
        }
    }

    async checkShortcutIntent() {
        try {
            const intent = await getShortcutIntent()
            const intentId = intent.extras['gls.blogs.id']
            if (intent.extras['gls.blogs.hash'] === '#app-settings' && localStorage.getItem('processed_intent') !== intentId) {
                this.appSettings = true
                localStorage.setItem('processed_intent', intentId)
            }
        } catch (err) {
            console.error('Cannot get shortcut intent', err)
        }
    }

    componentDidMount() {
        if (process.env.BROWSER) {
            console.log('ui-blogs version:', $STM_Config.ui_version);
            console.log('golos-lib-js version:', libInfo.version, 'hash:', libInfo.hash)
        }

        if (process.env.MOBILE_APP) {
            (async () => {
                await this.checkShortcutIntent()
                onShortcutIntent(intent => {
                    if (intent.extras['gls.blogs.hash'] === '#app-settings') {
                        openAppSettings()
                    }
                })

                fixRouteIfApp()

                document.addEventListener('pause', this.onPause)
                document.addEventListener('resume', this.onResume)

                cordova.exec((winParam) => {
                    console.log('initNativeCore ok', winParam)
                }, (err) => {
                    console.error('initNativeCore err', err)
                }, 'CorePlugin', 'initNativeCore', [])

                this.setState({
                    can_render: true
                })

                this.stopService()
            })()

            document.addEventListener('backbutton', e => {
              backRouteFix(e)
            })
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
        if (process.env.MOBILE_APP) {
            document.addEventListener('pause', this.onPause)
            document.addEventListener('resume', this.onResume)
        }
    }

    componentDidUpdate(nextProps) {
        // setTimeout(() => this.setState({showCallout: false}), 15000);
        if (nextProps.router.location &&
            nextProps.router.location.pathname !== this.props.router.location.pathname) {
            this.setState({ showBanner: false, showCallout: false });
        }
    }

    componentDidCatch(err, info) {
        const errStr = (err && err.toString()) ? err.toString() : JSON.stringify(err)
        const infoStr = (info && info.componentStack) || JSON.stringify(info)
        if (confirm(';( Ошибка рендеринга. Продолжить работу?\n\n' + errStr + '\n' + infoStr)) {
            reloadLocation('/')
            return
        }
        throw err
    }

    onPause = () => {
        const { username } = this.props
        const notifySess = localStorage.getItem('X-Session')
        const notifyHost = $STM_Config.notify_service.host
        if (username && notifySess) {
            const settings = PushNotificationSaga.getScopePresets(username)
            if (!settings.inBackground) {
                console.warn('Notify - inBackground false, so do not starting service...')
                return
            }
            if (!settings.bgPresets.length) {
                console.warn('Notify - all background presets disabled, so do not starting service...')
                return
            }
            const lastTake = 0
            cordova.exec((winParam) => {
                console.log('pause ok', winParam)
            }, (err) => {
                console.error('pause err', err)
            }, 'CorePlugin', 'startService', [username, notifySess, settings.bgPresets.join(','), lastTake, notifyHost])
        }
    }

    onResume = () => {
        this.stopService()
    }

    stopService = () => {
        cordova.exec((winParam) => {
            console.log('resume ok', winParam)
        }, (err) => {
            console.error('resume err', err)
        }, 'CorePlugin', 'stopService', [])
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

            const leavePage = `/leave_page?${a.href}`
            if (process.env.MOBILE_APP) {
                reloadLocation(leavePage)
                return
            }
            const win = window.open(leavePage, '_blank');
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
    //     router.navigate(a.pathname + a.search + a.hash);
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
        if (process.env.MOBILE_APP && !this.state.can_render) {
            return <LoadingIndicator type='circle' />
        }

        const {
            flash,
            new_visitor,
            nightmodeEnabled,
            loggedIn,
        } = this.props;
        const {
            location,
            params,
        } = this.props.router;
        let {
            hideOrders,
            hideOrdersMe,
        } = this.props;
        if (loggedIn) {
            hideOrders = hideOrdersMe
        }

        const route = resolveRoute(location.pathname);
        const lp = location.pathname === '/';
        let miniHeader = false;
        const params_keys = Object.keys(params);
        const ip =
            location.pathname === '/' ||
            (params_keys.length === 2 &&
                params_keys[0] === 'order' &&
                params_keys[1] === 'category');
        const f_alert = this.props.error || flash.get('alert');
        const warning = flash.get('warning');
        const success = flash.get('success');
        let callout = null;
        const notifyLink = $STM_Config.add_notify_site.link;
        const notifyTitle = $STM_Config.add_notify_site.title;
        const showInfoBox = $STM_Config.add_notify_site.show && this.isShowInfoBox($STM_Config.add_notify_site);

        if (this.state.showCallout && (f_alert || warning || success)) {
            callout = (
                <div className="App__announcement row">
                    <div className="column">
                        <div className="callout">
                            <CloseButton
                                onClick={() =>
                                    this.setState({ showCallout: false })
                                }
                            />
                            <p>{f_alert || warning || success}</p>
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

        const query = new URLSearchParams(location.search);
        let invite = query.get('invite');
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

        const isApp = location.pathname.startsWith('/__app_') || this.appSettings

        const isSubmit = location.pathname.startsWith('/submit')
        const noHeader = isApp
        const noFooter = isApp || isSubmit

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
                {process.env.BROWSER ? <NavigateHelper /> : null}
                {process.env.BROWSER ? <Toaster position='bottom-left' /> : null}
                {noHeader ? null : (miniHeader ? <MiniHeader /> : <Header />)}
                <div className={cn('App__content' +
                    (noHeader ? ' no-header' : ''), {
                    'ho': hideOrders,
                    'App__content_hide-sub-menu': route.hideSubMenu,
                })}>
                    {welcome_screen}
                    {callout}
                    <ChainFailure />
                    {this.appSettings ? <AppSettings.component /> : <Outlet />}
                    {noFooter ? null : <Footer />}
                    {isSubmit ? null : <NewsPopups />}
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
                {process.env.BROWSER ? <LocationWatch /> : null}
            </div>

        );
    }
}

App.propTypes = {
    error: PropTypes.string,
    location: PropTypes.object,
    loginUser: PropTypes.func.isRequired,
    logoutUser: PropTypes.func.isRequired,
    depositSteem: PropTypes.func.isRequired,
    nightmodeEnabled: PropTypes.bool,
    loggedIn: PropTypes.bool
};

export default connect(
    state => {
        let nightmodeEnabled = process.env.BROWSER ? localStorage.getItem('nightmodeEnabled') == 'true' || false : false

        const currentUser = state.user.get('current')

        return {
            error: state.app.get('error'),
            flash: state.offchain.get('flash'),
            loggedIn: !!state.user.get('current'),
            new_visitor:
                !currentUser &&
                !state.offchain.get('account') &&
                state.offchain.get('new_visit'),
            nightmodeEnabled: nightmodeEnabled,
            username: currentUser && currentUser.get('username'),
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
)(withRouter(withScreenSize(App)))
