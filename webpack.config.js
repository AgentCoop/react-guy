'use strict'
var webpack = require('webpack');

var env = process.env.NODE_ENV;
var reactExternal = {
    root: 'React',
    commonjs2: 'react',
    commonjs: 'react',
    amd: 'react'
};

var config = {
    externals: {
        react: reactExternal
    },
    mode: 'development',
    module: {
        rules: [
            { test: /\.js$/, loaders: ['babel-loader'], exclude: /node_modules/ }
        ]
    },
    output: {
        library: 'Composer',
        libraryTarget: 'umd'
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(env)
        })
    ]
}

if (env === 'production') {
    config.mode = 'production';
}

module.exports = config;