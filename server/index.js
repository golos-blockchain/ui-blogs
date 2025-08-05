import config from 'config';
import * as golos from 'golos-lib-js';
const version = require('./version');
const { packBlacklist } = require('../app/utils/blacklist')

delete process.env.BROWSER;

const path = require('path');
const ROOT = path.join(__dirname, '..');

// Tell `require` calls to look into `/app` also
// it will avoid `../../../../../` require strings
process.env.NODE_PATH = path.resolve(__dirname, '..');
require('module').Module._initPaths();

let blocked_users = config.get('blocked_users')
blocked_users = packBlacklist(blocked_users)

let blocked_posts = config.get('blocked_posts')
blocked_posts = packBlacklist(blocked_posts)

const concatURL = (url, base) => {
    const scheme = process.env.NODE_ENV === 'development' ? 'http://' : 'https://'
    base = scheme + base
    return new URL(url, base).toString()
}

const optGet = (key) => {
    return config.has(key) && config.get(key)
}

global.$STM_Config = {
    ws_connection_client: optGet('proxy_node') ?
        concatURL('/api/v1/node_send', config.get('site_domain')) :
        config.get('ws_connection_client'),
    show_adv_banners: config.get('show_adv_banners'),
    logo: config.get('logo'),
    add_notify_site: config.get('add_notify_site'),
    images: config.get('images'),
    site_domain: config.get('site_domain'),
    google_analytics_id: config.get('google_analytics_id'),
    chain_id: config.get('chain_id'),
    elastic_search: config.get('elastic_search'),
    auth_service: config.get('auth_service'),
    notify_service: config.get('notify_service'),
    wallet_service: config.get('wallet_service'),
    messenger_service: config.get('messenger_service'),
    apidex_service: config.get('apidex_service'),
    golos_news: config.has('golos_news') ? config.get('golos_news') : {
        account: 'progolos'
    },
    forums: config.get('forums'),
    blocked_users,
    blocked_posts,
    filter_apps: config.get('filter_apps'),
    authorization_required: config.has('authorization_required') && config.get('authorization_required'),
    ui_version: version || '1.0-unknown',
};

//const WebpackIsomorphicTools = require('webpack-isomorphic-tools');
//global.webpackIsomorphicTools = new WebpackIsomorphicTools(require('../webpack/webpack-isotools-config'));

//global.webpackIsomorphicTools.server(ROOT, () => {
    golos.config.set('websocket', config.get('ws_connection_server'))
    golos.config.set('chain_id', config.get('chain_id'))

    try {
        require('./server');
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
//});
