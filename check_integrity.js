const fs = require('fs')
const { hashElement } = require('folder-hash')

async function main(argv) {
    try {
        const hashOut = './lib/my_hash.js'

        const path = 'node_modules/golos-lib-js'

        const res = await hashElement(path, {
            files: {
                exclude: [
                    path + '/lib/my_hash.js',
                    path + '/dist/golos.min.js.gz',
                    path + '/dist/golos-tests.min.js.gz',
                    path + '/dist/stats.html',
                    // These not including when NPM publishes
                    '.npmrc',
                    '.babelrc',
                    '.gitignore',
                    '.npmignore',
                    'yarn.lock',
                ],
                matchBasename: true,
                matchPath: true,
            },
            folders: {
                exclude: [
                    'node_modules',
                    path + '/src',
                    path + '/examples'
                ],
                matchPath: true,
                ignoreRootName: true
            }
        })

        console.log(res.children)
        //console.log(res.children.filter(o => o.name === 'lib')[0].children.filter(o => o.name === 'auth')[0].children)

        console.log('LIBRARY HASH IS', res.hash)

        if (argv[2] === '--save') {
            let json = 'node_modules/golos-lib-js/package.json'
            json = fs.readFileSync(json, 'utf8')
            json = JSON.parse(json)

            const appPath = 'app/JsLibHash.json'
            let data = {}
            data.version = json.version
            data.hash = res.hash
            fs.writeFileSync(appPath, JSON.stringify(data))
        }
    } catch (err) {
        console.error('LIBRARY HASH FAILED:', err)
    }
}

main(process.argv)
