var React = require('react')
var ReactDOMServer = require('react-dom/server');
const fs = require('fs')
const fse = require('fs-extra')
const config = require('config')
import ServerHTML from './server/server-html';

const app_version = require('./package.json').version

let destDir, cfgFile
const argv = process.argv
if (argv.length !== 4) {
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
copyKey('logo')
copyKey('ws_connection_app')
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
copyKey('main_app')
fs.writeFileSync(cfgFile, 'module.exports = ' + JSON.stringify(cfg, null, 4))
