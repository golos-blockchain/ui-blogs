var React = require('react')
var ReactDOMServer = require('react-dom/server');
const fs = require('fs')
const fse = require('fs-extra')
const config = require('config')
import ServerHTML from './server/server-html';

const app_version = require('./package.json').version
const assets_filename = process.env.NODE_ENV === 'production' ? './tmp/webpack-isotools-assets-prod.json' : './tmp/webpack-isotools-assets-dev.json';
const assets = require(assets_filename);

const props = { body: '', assets, title: '', relativeSrc: false };

let html = ReactDOMServer.renderToString(<ServerHTML {...props} />)
html = '<!DOCTYPE html>' + html
if (!fs.existsSync('dist/electron')) {
    fs.mkdirSync('dist/electron')
}
fs.writeFileSync('dist/electron/index.html', html)
if (!fs.existsSync('msgs-build')) {
    console.error('No msgs-build - please build ui-messenger first')
    process.exit(-1)
}
fse.copySync('msgs-build', 'dist/electron/msgs', { overwrite: true })
fs.copyFileSync('electron/app_settings.js', 'dist/electron/app_settings.js')
fs.copyFileSync('electron/context_menu.js', 'dist/electron/context_menu.js')
fs.copyFileSync('electron/electron.js', 'dist/electron/electron.js')
fs.copyFileSync('electron/menu.js', 'dist/electron/menu.js')
fs.copyFileSync('electron/settings_preload.js', 'dist/electron/settings_preload.js')
fs.copyFileSync('electron/state_keeper.js', 'dist/electron/state_keeper.js')
fs.copyFileSync('electron/splash.js', 'dist/electron/splash.js')
fse.copySync('app/locales', 'dist/electron/locales', { overwrite: true })
fse.copySync('app/assets/images', 'dist/electron/images', { overwrite: true }) // for some direct links

let cfg = {}
const copyKey = (key) => {
    cfg[key] = config.get('desktop.' + key)
}
cfg.app_version = app_version
copyKey('hide_comment_neg_rep')
copyKey('site_domain')
cfg.url_domains = [...config.get('desktop.another_domains')]
if (!cfg.url_domains.includes(cfg.site_domain)) {
    cfg.url_domains.push(cfg.site_domain)
}
copyKey('ws_connection_app')
copyKey('chain_id')
copyKey('images')
copyKey('auth_service')
copyKey('notify_service')
copyKey('messenger_service')
copyKey('elastic_search')
copyKey('apidex_service')
copyKey('hidden_assets')
copyKey('app_updater')
copyKey('forums')
copyKey('gamefication')
fs.writeFileSync('dist/electron/default_cfg.js', 'module.exports = ' + JSON.stringify(cfg, null, 4))
