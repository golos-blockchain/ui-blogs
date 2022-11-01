process.env.BABEL_ENV = 'browser';
process.env.NODE_ENV = 'development';

const serve = require('webpack-serve');
const configWeb = require('./dev.config')
const configApp = require('./dev-app.config')

const config = process.env.IS_APP ? configApp : configWeb

serve({ config }).then(server => {
    server.on('listening', ({ server, options }) => {
        console.log('webpack dev server listening on port %s', options.port);
    });
});
