var React = require('react')
var ReactDOMServer = require('react-dom/server');
const fs = require('fs')
const fse = require('fs-extra')
const config = require('config')
import ServerHTML from './server/server-html';

const blogs_version = require('./package.json').version

let destDir, cfgFile
const argv = process.argv
if (argv.length < 4) {
    console.log('Usage is: babel-node build_app_entry.js /path/to/build/dest /path/to/config')
    process.exit(-1)
}
destDir = argv[2]
cfgFile = argv[3]

if (destDir !== 'null') {
    const assets_filename = process.env.NODE_ENV === 'production' ? './tmp/webpack-isotools-assets-prod.json' : './tmp/webpack-isotools-assets-dev.json';
    const assets = require(assets_filename);

    const props = { body: '', assets, title: '', relativeSrc: false };

    let html = ReactDOMServer.renderToString(<ServerHTML {...props} />)
    html = '<!DOCTYPE html>' + html
    fs.writeFileSync(destDir + '/index.html', html)
    fse.copySync('app/locales', destDir + '/locales', { overwrite: true })
    fse.copySync('app/assets/images', destDir + '/images', { overwrite: true }) // for some direct links
}

if (cfgFile === '_mobile') {
    process.exit(0)
}

let cfg = {}
const copyKey = (key) => {
    cfg[key] = config.get('desktop.' + key)
}
cfg.blogs_version = blogs_version
if (argv[4]) cfg.app_version = argv[4]
if (argv[5]) cfg.wallet_version = argv[5]
if (argv[6]) cfg.msgs_version = argv[6]
copyKey('site_domain')
cfg.url_domains = [...config.get('desktop.another_domains')]
if (!cfg.url_domains.includes(cfg.site_domain)) {
    cfg.url_domains.push(cfg.site_domain)
}
copyKey('logo')
copyKey('ws_connection_app')
copyKey('ws_connection_exchange')
copyKey('chain_id')
copyKey('images')
copyKey('wallet_service')
cfg.blogs_service = {
    host: 'app://' + config.get('desktop.site_domain')
}
copyKey('auth_service')
copyKey('notify_service')
copyKey('messenger_service')
copyKey('elastic_search')
copyKey('apidex_service')
copyKey('app_updater')
copyKey('forums')
copyKey('hidden_assets')
copyKey('main_app')
fs.writeFileSync(cfgFile, 'module.exports = ' + JSON.stringify(cfg, null, 4))
