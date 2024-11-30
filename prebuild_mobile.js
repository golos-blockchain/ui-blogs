const config = require('config')
const fs = require('fs')
const app_version = require('./package.json').version

console.log('--- Making default config for react build...')

let cfg = {}
const copyKey = (key) => {
    cfg[key] = config.get('mobile.' + key)
}
cfg.app_version = app_version
copyKey('ws_connection_app')
copyKey('ws_connection_exchange')
copyKey('logo')
copyKey('images')
copyKey('wallet_service')
copyKey('messenger_service')
copyKey('auth_service')
copyKey('notify_service')
copyKey('elastic_search')
copyKey('apidex_service')
copyKey('app_updater')
copyKey('forums')
copyKey('hidden_assets')
fs.writeFileSync('app/app_cfg.js', '/* Only Mobile. Generated automatically. Do not edit. */\r\nmodule.exports = ' + JSON.stringify(cfg, null, 4))

console.log('--- Config done. Next stage is running react build.')
