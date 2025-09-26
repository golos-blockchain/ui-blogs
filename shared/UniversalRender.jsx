/* eslint react/display-name: 0 */
/* eslint space-before-function-paren:0 */
// https://github.com/eslint/eslint/issues/4442
import Iso from 'iso';
import React from 'react';
import { render } from 'react-dom';
import { renderToString } from 'react-dom/server';
import {
    Router,
    RouterContext,
    match,
    applyRouterMiddleware
} from 'react-router';
import { Provider } from 'react-redux';
import RootRoute from 'app/RootRoute'
import router from 'app/router'
import {createStore, applyMiddleware, compose} from 'redux';
import { browserHistory } from 'react-router';
import {
    RouterProvider,
} from "react-router-dom";
import {
    createStaticHandler,
    createStaticRouter,
    StaticRouterProvider
} from "react-router-dom/server";
import { useScroll } from 'react-router-scroll';
import createSagaMiddleware from 'redux-saga';
import { syncHistoryWithStore } from 'react-router-redux';

import * as api from 'app/utils/APIWrapper'
import rootReducer from 'app/redux/RootReducer';
import rootSaga from 'app/redux/RootSaga';
import {component as NotFound} from 'app/components/pages/NotFound';
import extractMeta from 'app/utils/ExtractMeta';
import Translator from 'app/Translator';
import getState from 'app/utils/StateBuilder';
import {routeRegex} from "app/ResolveRoute";
import session from 'app/utils/session'
import {contentStats} from 'app/utils/StateFunctions'
import {APP_NAME, SEO_TITLE} from 'app/client_config';
import constants from 'app/redux/constants';

const sagaMiddleware = createSagaMiddleware();

let middleware;

if (process.env.BROWSER && process.env.NODE_ENV === 'development') {
    const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
    middleware = composeEnhancers(
        applyMiddleware(sagaMiddleware)
    );
} else {
    middleware = applyMiddleware(sagaMiddleware);
}

const runRouter = (location, routes) => {
    return new Promise((resolve) =>
        match({routes, location}, (...args) => resolve(args)));
};

const onRouterError = (error) => {
    console.error('onRouterError', error);
};

const handler = createStaticHandler(RootRoute)

export async function serverRender({
    location,
    absoluteUrl,
    offchain,
    ErrorPage,
}) {
    /*let error, redirect, renderProps;

    try {
        [error, redirect, renderProps] = await runRouter(location, RootRoute);
    } catch (e) {
        console.error('Routing error:',
            process.env.NODE_ENV === 'development' ? e : e.toString(),
            location);
        return {
            title: 'Routing error - ' + APP_NAME,
            statusCode: 500,
            body: renderToString(ErrorPage ? <ErrorPage /> : <span>Routing error</span>)
        };
    }
    if (error || !renderProps) {
        // debug('error')('Router error', error);
        return {
            title: 'Page Not Found - ' + APP_NAME,
            statusCode: 404,
            body: renderToString(<NotFound />)
        };
    }*/

    if (process.env.BROWSER) {
        const store = createStore(rootReducer, initial_state, middleware);
        if (!session.load().currentName && $STM_Config.authorization_required) {
            store.dispatch({type: 'user/REQUIRE_LOGIN', payload: {}});
        }
        // sagaMiddleware.run(PollDataSaga).done
        //     .then(() => console.log('PollDataSaga is finished'))
        //     .catch(err => console.log('PollDataSaga is finished with error', err));

        const history = syncHistoryWithStore(browserHistory, store);
        // const scrollHistory = useScroll(() => history)();
        window._reduxStore = store;
        window.store = {
            getState: () => {debugger}
        }
        // Bump transaction (for live UI testing).. Put 0 in now (no effect),
        // to enable browser's autocomplete and help prevent typos.
        window.bump = parseInt(localStorage.getItem('bump') || 0);
        const scroll = useScroll((prevLocation, {location}) => {
            if (location.hash || location.action === 'POP') return false;
            return !prevLocation || prevLocation.location.pathname !== location.pathname;
        });
        if (process.env.NODE_ENV === 'production') {
            // console.log('%c%s', 'color: red; background: yellow; font-size: 24px;', 'WARNING!');
            // console.log('%c%s', 'color: black; font-size: 16px;', 'This is a developer console, you must read and understand anything you paste or type here or you could compromise your account and your private keys.');
        }
        return render(
            <Provider store={store}>
                <Translator>
                    <Router
                        routes={RootRoute}
                        history={history}
                        onError={onRouterError}
                        render={applyRouterMiddleware(scroll)} />
                </Translator>
            </Provider>,
            document.getElementById('content')
        );
    }

    // below is only executed on the server
    let serverStore, onchain, noMeta;
    try {
        let url = location === '/' ? 'trending' : location;
        // Replace these URLs with /transfers for UserProfile to resolve data correctly
        if (url.indexOf('/curation-rewards') !== -1) url = url.replace(/\/curation-rewards$/, '/transfers');
        if (url.indexOf('/author-rewards') !== -1) url = url.replace(/\/author-rewards$/, '/transfers');
        if (url.indexOf('/donates-from') !== -1) url = url.replace(/\/donates-from$/, '/transfers');
        if (url.indexOf('/donates-to') !== -1) url = url.replace(/\/donates-to$/, '/transfers');

        onchain = await getState(api, url, offchain)

         // protect for invalid account
        if (Object.getOwnPropertyNames(onchain.accounts).length === 0 && (location.match(routeRegex.UserProfile1) || location.match(routeRegex.UserProfile3))) {
            return {
                title: 'User Not Found - ' + APP_NAME,
                statusCode: 404,
                body: renderToString(<NotFound />)
            };
        }

        // If we are not loading a post, truncate state data to bring response size down.
        if (!url.match(routeRegex.Post)) {
            for (let key in onchain.content) {
                //onchain.content[key]['body'] = onchain.content[key]['body'].substring(0, 1024) // TODO: can be removed. will be handled by steemd
                // Count some stats then remove voting data. But keep current user's votes. (#1040)
                onchain.content[key]['stats'] = contentStats(onchain.content[key])
            }
        }

        if (!url.match(routeRegex.PostsIndex) && !url.match(routeRegex.UserProfile1) && !url.match(routeRegex.UserProfile2) && !url.match(routeRegex.UserAssetEndPoints) && url.match(routeRegex.PostNoCategory)) {
            const params = url.substr(2, url.length - 1).split("/");
            const content = await api.getContent(params[0], params[1].split('?')[0]);
            if (content.author && content.permlink) { // valid short post url
                onchain.content[url.substr(2, url.length - 1)] = content;
            } else { // protect on invalid user pages (i.e /user/transferss)
                return {
                    title: 'Page Not Found - ' + APP_NAME,
                    statusCode: 404,
                    body: renderToString(<NotFound />)
                };
            }
        }

        offchain.server_location = location;
        serverStore = createStore(rootReducer, { global: onchain, offchain});
        if (!offchain.account && $STM_Config.authorization_required) {
            noMeta = true
            serverStore.dispatch({type: 'user/REQUIRE_LOGIN', payload: {}});
        }
        serverStore.dispatch({type: '@@router/LOCATION_CHANGE', payload: {pathname: location}});
        // TODO: maybe use request to golosnotify to fetch counters?
        /*if (offchain.account) {
            try {
                const notifications = await tarantool.select('notifications', 0, 1, 0, 'eq', offchain.account);
                serverStore.dispatch({type: 'UPDATE_NOTIFICOUNTERS', payload: notificationsArrayToMap(notifications)});
            } catch(e) {
                console.warn('WARNING! cannot retrieve notifications from tarantool in universalRender:', e.message);
            }
        }*/
    } catch (e) {
        // Ensure 404 page when username not found
        if (location.match(routeRegex.UserProfile1)) {
            console.error('User/not found: ', location);
            return {
                title: 'Page Not Found - ' + APP_NAME,
                statusCode: 404,
                body: renderToString(<NotFound />)
            };
        // Ensure error page on state exception
        } else {
            const msg = (e.toString && e.toString()) || e.message || e;
            const stack_trace = e.stack || '[no stack]';
            console.error('State/store error: ', msg, stack_trace);
            return {
                title: 'Server error - ' + APP_NAME,
                statusCode: 500,
                body: renderToString(<ErrorPage />)
            };
        }
    }

    const fetchReq = new Request(absoluteUrl); 
    const context = await handler.query(fetchReq);

    const router = createStaticRouter(handler.dataRoutes, context);

    let app, status, meta;
    try {
        /*app = renderToString(
            <Provider store={serverStore}>
                <Translator>
                    <RouterContext />
                </Translator>
            </Provider>
        );*/
        app = renderToString(
            <Provider store={serverStore}>
                <Translator>
                    <StaticRouterProvider router={router} context={context} />
                </Translator>
            </Provider>
        );
        meta = [];//noMeta ? [] : extractMeta(onchain, renderProps.params);
        status = 200;
    } catch (re) {
        console.error('Rendering error: ', re, re.stack);
        app = renderToString(<ErrorPage />);
        status = 500;
    }

    return {
        title: SEO_TITLE,
        titleBase: SEO_TITLE + ' - ',
        meta,
        statusCode: status,
        body: Iso.render(app, serverStore.getState())
    };
}

export function clientRender(initialState) {
    const store = createStore(rootReducer, initialState, middleware);
    if (!session.load().currentName && $STM_Config.authorization_required) {
        store.dispatch({type: 'user/REQUIRE_LOGIN', payload: {}});
    }
    sagaMiddleware.run(rootSaga)

    //const history = syncHistoryWithStore(browserHistory, store);

    window.store = {
        getState: () => { debugger }
    }
    window._reduxStore = store;
    // Bump transaction (for live UI testing).. Put 0 in now (no effect),
    // to enable browser's autocomplete and help prevent typos.
    window.bump = parseInt(localStorage.getItem('bump') || 0);
    const scroll = useScroll((prevLocation, { location }) => {
        if (location.hash || location.action === 'POP') return false;
        return !prevLocation || prevLocation.location.pathname !== location.pathname;
    });

    if (process.env.NODE_ENV === 'production') {
        // console.log('%c%s', 'color: red; background: yellow; font-size: 24px;', 'WARNING!');
        // console.log('%c%s', 'color: black; font-size: 16px;', 'This is a developer console, you must read and understand anything you paste or type here or you could compromise your account and your private keys.');
    }

    const Wrapper =
        process.env.NODE_ENV !== 'production' && localStorage['react.strict']
            ? React.StrictMode
            : React.Fragment;

                    // <Router
                    //     routes={RootRoute}
                    //     history={history}
                    //     onError={onRouterError}
                    //     render={applyRouterMiddleware(scroll)}
                    // />

    window._router = router;

    return render(
        <Wrapper>
            <Provider store={store}>
                <Translator>
                    <RouterProvider router={router} />
                </Translator>
            </Provider>
        </Wrapper>,
        document.getElementById('content')
    );
}
