const app = require('electron').app
const fs = require('fs')
 
module.exports = function (name, defaults) {
    let fileName = 'window-state-' + name + '.json';
    fileName = app.getPath('userData') + '/' + fileName;
 
    let state = { }
    let loadedData = null
    try {
        loadedData = fs.readFileSync(fileName);
    } catch (error) {
        console.error('Cannot read window state', error)
    }
    if (loadedData) {
        try {
            state = JSON.parse(loadedData)
        }
        catch (error) {
            console.error('Cannot parse window state', error)
        }
    }
    if (!state.width || !state.height || state.isMaximized === undefined) {
        state.width = defaults.width
        state.height = defaults.height
        state.isMaximized = defaults.isMaximized
    }
    if (!state.isMaximized) state.isMaximized = false
 
    const saveState = function (win) {
        state.isMaximized = win.isMaximized()
        if (!state.isMaximized) {
            const position = win.getPosition()
            const size = win.getSize()
            state.x = position[0]
            state.y = position[1]
            state.width = size[0]
            state.height = size[1]
        }
        fs.writeFileSync(fileName, JSON.stringify(state))
    }
 
    return {
        get x() { return state.x },
        get y() { return state.y },
        get width() { return state.width },
        get height() { return state.height },
        get isMaximized() { return state.isMaximized },
        saveState
    }
}
