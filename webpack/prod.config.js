const webpack = require('webpack');
const { merge } = require('webpack-merge')
const baseConfig = require('./base.config');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin')
//const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const ExportAssetsPlugin = require('./plugins/ExportAssetsPlugin')

module.exports = merge(baseConfig, {
    mode: 'production',
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                BROWSER: JSON.stringify(process.env.BROWSER),
                NODE_ENV: JSON.stringify('production'),
            },
            // global: {
            //     TYPED_ARRAY_SUPPORT: JSON.stringify(false),
            // },
        }),
        new ExportAssetsPlugin(),
        new MiniCssExtractPlugin({
            filename: '[name].[chunkhash].css',
            chunkFilename: '[id].[chunkhash].css',
        }),
    ],
    module: {
        rules: [
            {
                test: /\.(sa|sc|c)ss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
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
                        },
                    },
                    'sass-loader',
                ],
            },
        ],
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                cache: true,
                parallel: true,
                sourceMap: false,
            }),
            /*new OptimizeCSSAssetsPlugin({
                cssProcessorOptions: {
                    safe: true,
                }
            }),*/
        ],
    },
});
