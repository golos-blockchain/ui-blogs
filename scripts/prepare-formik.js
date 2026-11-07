'use strict';
// Explicit, hooks-free source preparation; run before yarn install --frozen-lockfile --ignore-scripts.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const commit = 'b697b6ef3f13c795bb862b35589fffde442ab465';
const upstream = 'https://github.com/golos-blockchain/formik.git';
const root = path.resolve(__dirname, '..');
const destination = path.join(root, 'git-deps', 'formik');
function git(args, cwd = destination) {
    return execFileSync('git', ['-c', 'core.hooksPath=' + path.join(root, 'git-deps', 'no-hooks'), ...args], {
        cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'],
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
    }).trim();
}
fs.mkdirSync(path.dirname(destination), { recursive: true });
if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination);
    git(['init']);
    git(['remote', 'add', 'origin', upstream]);
    git(['-c', 'credential.helper=', 'fetch', '--depth=1', 'origin', commit]);
    git(['checkout', '--detach', commit]);
}
if (git(['remote', 'get-url', 'origin']) !== upstream || git(['rev-parse', 'HEAD']) !== commit || git(['status', '--porcelain', '--untracked-files=all'])) {
    throw new Error('Formik source is not the clean official pinned commit; refusing to overwrite it');
}
for (const file of ['LICENSE', 'packages/formik/package.json', 'packages/formik/dist/index.js', 'packages/formik/dist/formik.esm.js']) {
    if (!fs.existsSync(path.join(destination, file))) throw new Error('Missing pinned Formik file: ' + file);
}
// The repository stores the genuine built dist at this commit: no tsdx/prepublish hook is needed.
console.log('Verified official Formik source and license: ' + commit);
