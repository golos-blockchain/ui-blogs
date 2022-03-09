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

    if (cfg.images.use_img_proxy === undefined) {
        cfg.images.use_img_proxy = true
    }
    if (!cfg.ws_connection_client) {
        cfg.ws_connection_client = cfg.ws_connection_app[0].address
    }

    cfg.platform = process.platform

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