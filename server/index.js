import config from 'config';
import * as golos from 'golos-lib-js';
const version = require('./version');

delete process.env.BROWSER;

const path = require('path');
const ROOT = path.join(__dirname, '..');

// Tell `require` calls to look into `/app` also
// it will avoid `../../../../../` require strings
process.env.NODE_PATH = path.resolve(__dirname, '..');
require('module').Module._initPaths();

global.$STM_Config = {
    ws_connection_client: config.get('ws_connection_client'),
    hide_comment_neg_rep: config.get('hide_comment_neg_rep'),
    show_adv_banners: config.get('show_adv_banners'),
    add_notify_site: config.get('add_notify_site'),
    images: config.get('images'),
    site_domain: config.get('site_domain'),
    google_analytics_id: config.get('google_analytics_id'),
    chain_id: config.get('chain_id'),
    elastic_search: config.get('elastic_search'),
    auth_service: config.get('auth_service'),
    notify_service: config.get('notify_service'),
    messenger_service: config.get('messenger_service'),
    apidex_service: config.get('apidex_service'),
    hidden_assets: config.get('hidden_assets'),
    forums: config.get('forums'),
    blocked_users: config.get('blocked_users'),
    blocked_posts: config.get('blocked_posts'),
    ui_version: version || '1.0-unknown',
};

const WebpackIsomorphicTools = require('webpack-isomorphic-tools');
global.webpackIsomorphicTools = new WebpackIsomorphicTools(require('../webpack/webpack-isotools-config'));

global.webpackIsomorphicTools.server(ROOT, () => {
    golos.config.set('websocket', config.get('ws_connection_server'))
    golos.config.set('chain_id', config.get('chain_id'))

    try {
        require('./server');
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
});
