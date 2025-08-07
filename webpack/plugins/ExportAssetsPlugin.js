
module.exports = class ExportAssetsPlugin {
    constructor(options = {}) {
        this.development = !!options.development
    }

    apply(compiler) {
        console.log("Exporting assets...")
        compiler.hooks.afterEmit.tap('ExportAssetsPlugin', (compilation) => {
            /*for (let a of compilation.getAssets()) {
                if (a.name.endsWith('.js')) {
                    //console.log(a)
                }
            }*/
            const jsFiles = {}
            const cssFiles = {}

            const entryNames = Array.from(compilation.entrypoints.keys())
            for (let i = 0; i < entryNames.length; ++i) {
                const entryFiles = compilation.entrypoints.get(entryNames[i]).getFiles()
                for (let fn of entryFiles) {
                    if (fn.endsWith('.js')) {
                        jsFiles[fn] = '/assets/' + fn
                    } else if (fn.endsWith('.css')) {
                        cssFiles[fn] = '/assets/' + fn
                    }
                }
            }

            let res = {
                javascript: jsFiles,
                styles: cssFiles,
            }
            res = JSON.stringify(res, null, 2)

            const dir = './tmp'
            const assetsFile = dir + '/assets' + (this.development ? '-dev' : '') + '.json'
            const fs = require('fs')
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir)
            }
            fs.writeFileSync(assetsFile, res)
        })
    }
}
