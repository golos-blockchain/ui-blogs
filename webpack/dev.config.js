const path = require('path')

const webpack = require('webpack');
const { merge } = require('webpack-merge')
const git = require('git-rev-sync');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const baseConfig = require('./base.config');
const ExportAssetsPlugin = require('./plugins/ExportAssetsPlugin');
//const StartServerPlugin = require('./plugins/StartServerPlugin');

const WEBPACK_PORT = process.env.PORT ? parseInt(process.env.PORT) + 1 : 8081;

let VERSION = 'dev'
try {
    VERSION = JSON.stringify(git.long())
} catch (err) {}

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
                VERSION,
            },
            //global: {
            //    TYPED_ARRAY_SUPPORT: JSON.stringify(false),
            //},
        }),
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
                    { loader: 'css-loader', options: { sourceMap: true, url: false } },
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
