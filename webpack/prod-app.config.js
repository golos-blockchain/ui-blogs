const webpack = require('webpack');
const { merge } = require('webpack-merge')
const path = require('path');
let prodConfig = require('./prod.config');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

delete prodConfig.optimization.minimizer

module.exports = merge(prodConfig, {
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
    ],
    entry: {
        app: [ './app/MainApp.js' ],
        // vendor: ['react', 'react-dom', 'react-router']
    },
    output: {
        path: path.resolve(__dirname, '../dist/electron/assets'),
    },
    optimization: {
        minimizer: [
            new OptimizeCSSAssetsPlugin({
                cssProcessorOptions: {
                    safe: true,
                }
            }),
        ],
    },
});
