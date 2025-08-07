const path = require('path');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const webpack = require('webpack')

const alias = require('./alias');

module.exports = {
    context: path.resolve(__dirname, '..'),
    entry: {
        app: [ './app/Main.js' ],
        // vendor: ['react', 'react-dom', 'react-router']
    },
    output: {
        path: path.resolve(__dirname, '../build-client'),
        filename: '[name].[chunkhash].js',
        chunkFilename: '[id].[chunkhash].js',
        publicPath: '/assets/',
    },
    module: {
        rules: [
            {
                test: /\.js$|\.jsx$/,
                exclude: /node_modules/,
                use: 'babel-loader',
            },
            {
                test: /\.svg$/,
                type: 'asset/source'
            },
            {
                test: /\.(jpe?g|png|gif)/,
                type: 'asset'
            },
            {
                test: /\.(woff(2)?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
                type: 'asset/resource',
                generator: {
                    filename: '[name][ext]',
                    outputPath: 'fonts/',
                }
            },
            {
                test: /\.md/,
                type: 'asset/resource'
            },
            /*{
                test: /\.m?js$/,
                resolve: {
                    fullySpecified: false,
                }
            },*/
        ],
    },
    plugins: [
        new ProgressBarPlugin({
            format: 'Build [:bar] :percent (:elapsed seconds)',
            clear: false,
        }),
        new webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer'],
        }),
    ],
    optimization: {
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                vendors: {
                    test: /node_modules/,
                    enforce: true,
                },
                // styles: {
                //     name: 'styles',
                //     test: /\.css$/,
                //     chunks: 'all',
                //     enforce: true,
                // },
            },
        },
    },
    resolve: {
        modules: [path.resolve(__dirname, '..'), 'node_modules'],
        extensions: ['.js', '.json', '.jsx', '.css', '.scss'],
        alias,
        fallback: {
            "zlib": require.resolve("browserify-zlib"),
            "stream": require.resolve("stream-browserify")
        }
    },
};
