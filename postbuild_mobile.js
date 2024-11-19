const fs = require('fs')
const fse = require('fs-extra')
const cheerio = require('cheerio')
const CordovaConfig = require('cordova-config')
const config = require('config')

function dirExists(path) {
    try {
        return fs.statSync(path).isDirectory();
    } catch (e) {
        return false
    }
}

function copyDir(dir) {
    fse.copySync(dir, distPath + '/' + dir)
}

function patchLocalPluginVersion(moduleName, dir) { // Patch plugin version to do not broke on cordova prepare
    const coreVersion = JSON.parse(fs.readFileSync(dir + '/package.json')).version
    console.log('    ' + moduleName, 'version:', coreVersion)

    let json = JSON.parse(fs.readFileSync(distPath + '/package.json'))
    if (!json.devDependencies[moduleName]) {
        throw new Error(moduleName + ' dependency is not found in package.json/devDependencies')
    }
    json.devDependencies[moduleName] = coreVersion
    json = JSON.stringify(json, null, 2)
    fs.writeFileSync(distPath + '/package.json', json)
}


const distPath = 'cordova'
const configFile = distPath + '/config.xml'
const indexHtml = distPath + '/www/index.html'

console.log('--- Copying files to "' + distPath + '" folder...')

if (!fs.existsSync(distPath)) {
    fs.mkdirSync(distPath)
}
fs.copyFileSync('config.xml', configFile)
fs.copyFileSync('package.json', distPath + '/package.json') // for "cordova prepare"
fs.copyFileSync('yarn.lock', distPath + '/yarn.lock')

console.log('--- Adding hostname to "' + configFile + '" file...')

let cc = new CordovaConfig(configFile)
cc.setPreference('hostname', config.get('mobile.site_domain'))
cc.writeSync()

console.log('--- Moving react "build" folder to "' + distPath + '/www"')

if (dirExists('dist')) {
    fs.rmSync(distPath + '/www', { recursive: true, force: true });
    fs.renameSync('dist', distPath + '/www')
}

console.log('--- Copying "native_core" folder to "' + distPath + '/native_core"')

copyDir('native_core')

console.log('--- Patching "native_core" version for correct installation')

patchLocalPluginVersion('gls-blogs-native-core', 'native_core')

console.log('--- Clearing cordova in order to update in on "cordova prepare"')

fs.rmSync(distPath + '/platforms', { recursive: true, force: true })
fs.rmSync(distPath + '/plugins', { recursive: true, force: true })

console.log('--- Copying "res" folder to "' + distPath + '/res"')

copyDir('res')

console.log('--- Including cordova.js script into "' + indexHtml + '" file...')

let idx = fs.readFileSync(indexHtml, 'utf8')
idx = cheerio.load(idx)
if (idx('script[src="cordova.js"]').length === 0) {
    idx('<script src="cordova.js"></script>').insertBefore('script:first-of-type')
    idx('<script>var FileReader0 = FileReader</script>').insertBefore('script:first-of-type')
    console.log('Included.')
} else {
    console.log('Already exists.')
}
fs.writeFileSync(indexHtml, idx.html())

console.log('--- Copied. Installing Cordova plugins and platforms ("cordova prepare"), and building+running android')
