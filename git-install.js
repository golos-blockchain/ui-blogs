const fs = require('fs')
const util = require('util')
const exec = util.promisify(require('child_process').exec)

const package = require('./package.json')

const { dependencies, gitDependencies } = package

const dir = 'git-deps'

let clc = {}
for (const [key, code] of Object.entries({
    cyanBright: '\x1b[36m',
    yellowBright: '\x1b[33m',
    greenBright: '\x1b[32m',
})) {
    clc[key] = (...args) => {
        return code + [...args].join(' ') + '\x1b[0m'
    }
}

const logDep = (color, ...args) => {
    let msg = [' -', ...args]
    if (color) {
        msg = [clc[color](...msg)]
    }
    console.log(...msg)
}

async function main() {
    const { argv } = process
    if (argv[2] === '-c' || argv[2] === '--cleanup') {
      const files = await fs.promises.readdir(dir)
      for (const f of files) {
        if (f !== '.gitignore') {
          fs.rmSync(dir + '/' + f, { recursive: true, force: true })
        }
      }
      return
    }

    if (!gitDependencies) {
        console.log('No gitDependencies in package.json, so nothing to preinstall.')
        return
    }

    const lockFile = 'git-install-lock'
    if (fs.existsSync(lockFile)) {
        console.error(lockFile, 'exists, so cannot run. It is for recursion protection.')
        return
    }
    fs.writeFileSync(lockFile, '1')

    console.log(clc.cyanBright('preinstalling deps...'))

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir)
    }
    process.chdir(dir)

    const gitDeps = Object.entries(gitDependencies)
    const deps = {}
    for (const [ key, dep ] of gitDeps) {
        const url = new URL(dep)

        const { pathname } = url
        const [ repo, branchFolder ] = pathname.split('/tree/')
        let branch = '', folder = ''
        if (branchFolder) {
            const parts = branchFolder.split('/')
            branch = ' -b ' + parts[0]
            if (parts[1]) {
                parts.shift()
                folder = parts.join('/')
            }
        }

        const commit = url.hash.replace('#', '')
        const repoName = repo.split('/')[2]

        deps[key] = { dep, repo, branch, folder, repoName, commit }

        if (fs.existsSync(repoName)) {
            logDep('yellowBright', repoName, 'already cloned, using as cache.')
            continue
        }

        deps[key].cloned = true

        const clone = 'git clone ' + url.origin + repo + branch
        logDep('greenBright', clone)
        await exec(clone)

        if (commit) {
            process.chdir(repoName)
            const resetTo = 'git reset --hard ' + commit
            logDep(null, '-', resetTo)
            await exec(resetTo)
            process.chdir('..')
        }
    }

    console.log(' ')
    console.log(clc.cyanBright('yarn-adding cloned deps (if not added)...'))

    for (const [ key, dep ] of Object.entries(deps)) {
        let path = './' + dir + '/' + dep.repoName
        if (dep.folder) {
            path += '/' + dep.folder
        }

        if (argv[2] === '-f' || dependencies[key] !== path) {
            const add = 'yarn add ' + path
            logDep('greenBright', add)
            await exec(add)
        }
    }

    console.log(clc.greenBright('ok'))
    console.log('')

    fs.unlinkSync('../' + lockFile)
}

main()
