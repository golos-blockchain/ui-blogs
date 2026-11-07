const { app, ipcMain } = require('electron')
const fs = require('fs')

const defaultCfg = require('./default_cfg.js')

let fileName = 'app-settings.json';
fileName = app.getPath('userData') + '/' + fileName;

function init() {
    let cfg = defaultCfg

    let cfgData
    try {
        cfgData = fs.readFileSync(fileName);
    } catch (error) {}
    if (cfgData) {
        try {
           cfgData = JSON.parse(cfgData)
           cfg = { ...cfg, ...cfgData }
        } catch (error) {}
    }

    cfg.messenger_service = defaultCfg.messenger_service // Migrating from <=1.1.0 - strip user set value

    if (cfg.images.use_img_proxy === undefined) {
        cfg.images.use_img_proxy = true
    }
    if (!cfg.ws_connection_client) {
        cfg.ws_connection_client = cfg.ws_connection_app[0].address
    }

    cfg.platform = process.platform

    cfg.app_version = defaultCfg.app_version
    cfg.blogs_version = defaultCfg.blogs_version
    cfg.wallet_version = defaultCfg.wallet_version
    cfg.msgs_version = defaultCfg.msgs_version
    cfg.site_domain = defaultCfg.site_domain
    cfg.ws_connection_exchange = defaultCfg.ws_connection_exchange
    cfg.blogs_service = defaultCfg.blogs_service
    cfg.wallet_service = defaultCfg.wallet_service
    cfg.messenger_service = defaultCfg.messenger_service
    cfg.url_domains = defaultCfg.url_domains
    cfg.forums = defaultCfg.forums
    cfg.apidex_service = defaultCfg.apidex_service
    cfg.app_updater = defaultCfg.app_updater
    cfg.logo = defaultCfg.logo

    if (cfg.notify_service && defaultCfg.notify_service) {
        cfg.notify_service.host_ws = cfg.notify_service.host_ws || defaultCfg.notify_service.host_ws
    }

    ipcMain.on('get-settings', (e) => {
        e.returnValue = cfg
    })

    return cfg
}

function saveSettings(cfg) {
    cfg = JSON.stringify(cfg)
    fs.writeFileSync(fileName, cfg)
}

module.exports = {
    init,
    saveSettings
}