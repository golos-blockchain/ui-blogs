const path = require('path')

const webpack = require('webpack');
const { merge } = require('webpack-merge')
const git = require('git-rev-sync');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const baseConfig = require('./base.config');
const ExportAssetsPlugin = require('./plugins/ExportAssetsPlugin');
//const StartServerPlugin = require('./plugins/StartServerPlugin');

//const Webpack_isomorphic_tools_plugin = require('webpack-isomorphic-tools/plugin');
//const webpack_isomorphic_tools_plugin = new Webpack_isomorphic_tools_plugin(
//    require('./webpack-isotools-config')
//);

const WEBPACK_PORT = process.env.PORT ? parseInt(process.env.PORT) + 1 : 8081;

console.log('-----------------------------------------------------------------')
console.log(process.env.BROWSER)
console.log('-----------------------------------------------------------------')

module.exports = merge(baseConfig, {
    mode: 'development',
    devtool: 'source-map',
    output: {
        publicPath: '/assets/',
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                BROWSER: JSON.stringify(process.env.BROWSER),
                NODE_ENV: JSON.stringify('development'),
                VERSION: JSON.stringify(git.long()),
            },
            //global: {
            //    TYPED_ARRAY_SUPPORT: JSON.stringify(false),
            //},
        }),
        //webpack_isomorphic_tools_plugin.development(),
        new MiniCssExtractPlugin({
            filename: '[name].css',
            chunkFilename: '[id].css',
        }),
        new ExportAssetsPlugin({
            development: true
        }),
        //new StartServerPlugin(),
    ],
    module: {
        rules: [
            {
                test: /\.(sa|sc|c)ss$/,
                use: [
                    'style-loader',
                    { loader: 'css-loader', options: { sourceMap: true } },
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: [
                                    require('autoprefixer')({
                                        overrideBrowserslist: ['> 1%', 'last 2 versions'],
                                    })
                                ]
                            },
                            sourceMap: true,
                        },
                    },
                    { loader: 'sass-loader', options: { sourceMap: true } },
                ],
            },
        ],
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'assets'),
        },
        compress: true,
        port: WEBPACK_PORT,
        hot: true,
        client: {
            overlay: false,
        },
    },
});
