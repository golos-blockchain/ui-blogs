#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

module.exports = function (ctx) {
    const platformRoot = path.join(ctx.opts.projectRoot, 'platforms/android/app');
    const dest = path.join(platformRoot, 'google-services.json');
 
    const pluginDir = ctx.opts.plugin.dir;
    const src = path.join(pluginDir, 'google-services.json');
 
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log('✔ google-services.json copied to Android app/');
    } else {
        console.log('✖ google-services.json not found in plugin');
    }
}
