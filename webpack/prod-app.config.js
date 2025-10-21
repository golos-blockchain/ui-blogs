const webpack = require('webpack');
const { mergeWithCustomize, unique } = require('webpack-merge')
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin')

let prodConfig = require('./prod.config');
const ExportAssetsPlugin = require('./plugins/ExportAssetsPlugin')

delete prodConfig.entry
delete prodConfig.optimization.minimizer

module.exports = mergeWithCustomize({
    customizeArray: unique(
        'plugins',
        ['DefinePlugin'],
        (plugin) => plugin.constructor && plugin.constructor.name,
    ),
})(prodConfig, {
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                BROWSER: JSON.stringify(true),
                NODE_ENV: JSON.stringify('production'),
                IS_APP: JSON.stringify(true),
            },
            global: {
                TYPED_ARRAY_SUPPORT: JSON.stringify(false),
            },
        }),
        new ExportAssetsPlugin(),
    ],
    entry: {
        app: [ './app/MainApp.js' ],
        // vendor: ['react', 'react-dom', 'react-router']
    },
    output: {
        path: path.resolve(__dirname, '../dist/electron/assets'),
    },
    optimization: {
        minimize: false,
        minimizer: [
            new TerserPlugin(),
        ],
    },
});
