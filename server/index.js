import config from 'config';
import * as golos from 'golos-classic-js';
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
    ws_connection_msgs: config.get('ws_connection_msgs'),
    img_proxy_prefix: config.get('img_proxy_prefix'),
    img_proxy_backup_prefix: config.get('img_proxy_backup_prefix'),
    hide_comment_neg_rep: config.get('hide_comment_neg_rep'),
    show_adv_banners: config.get('show_adv_banners'),
    read_only_mode: config.get('read_only_mode'),
    add_notify_site: config.get('add_notify_site'),
    upload_image: config.get('upload_image'),
    site_domain: config.get('site_domain'),
    tarantool: config.get('tarantool'),
    google_analytics_id: config.get('google_analytics_id'),
    chain_id: config.get('chain_id'),
    elastic_search: config.get('elastic_search'),
    notify_service: config.get('notify_service'),
    forums: config.get('forums'),
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
