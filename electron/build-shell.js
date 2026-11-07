'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const dest = path.join(root, 'dist', 'electron');
if (!fs.existsSync(path.join(dest, 'index.html')) || !fs.existsSync(path.join(dest, 'default_cfg.js'))) throw Error('Build frontend and app-entry first');
for (const file of ['electron.js', 'app_settings.js', 'settings_preload.js']) fs.copyFileSync(path.join(__dirname, file), path.join(dest, file));
fs.cpSync(path.join(__dirname, 'rpc-discovery'), path.join(dest, 'rpc-discovery'), {recursive: true});
// Retain the pinned dependency's upstream Apache-2.0 license in standalone and Desktop copies.
const notices = path.join(dest, 'third-party-licenses');
fs.mkdirSync(notices, {recursive: true});
fs.copyFileSync(path.join(root, 'git-deps', 'formik', 'LICENSE'), path.join(notices, 'Formik-LICENSE'));
