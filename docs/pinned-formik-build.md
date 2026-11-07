# Pinned Formik preparation

Before the first dependency install, run `npm run prepare:formik`, then `yarn install --frozen-lockfile --ignore-scripts --non-interactive`. Use the project's approved Node/Yarn toolchain; no global installation is necessary. Preparation fetches only the official public repository's exact commit `b697b6ef3f13c795bb862b35589fffde442ab465`, checks its origin, clean worktree and HEAD, and refuses to overwrite an existing unexpected checkout. Generated source is ignored under `git-deps/formik`.

This commit already tracks genuine Formik `packages/formik/dist`; do not run its tsdx/prepublish scripts or enable unrelated install hooks. `package.json` references this prepared subpackage, not the obsolete HTTP-402 gitpkg service. `yarn.lock` retains all unrelated original selector bodies and the previously reviewed Electron 39.1.2 / electron-builder 26.0.12 dependency closure. The shell build retains Formik's original Apache-2.0 LICENSE under `dist/electron/third-party-licenses/Formik-LICENSE`.

Then run `yarn run build:standalone` to build current Blogs renderer, app entry and shell. This is source/renderer assembly, not a native Windows release, installer or GUI/financial acceptance test.
