const nodeExternals = require('webpack-node-externals')
const webpack = require('webpack')
const packagejson = require('./package.json')

const SIGVER_VERSION = packagejson.version

function externals(context, request, callback) {
  if (/package\.json$/.test(request)) {
    return callback(null, 'commonjs ' + request)
  } else {
    return nodeExternals()(context, request, callback)
  }
}

module.exports = {
  mode: 'production',
  entry: './src/index.ts',
  output: {
    filename: 'server.js',
  },
  target: 'node',
  externals: [externals],
  module: {
    rules: [
      {
        test: /\.ts/,
        loader: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  plugins: [
    new webpack.DefinePlugin({
      SIGVER_VERSION: JSON.stringify(SIGVER_VERSION)
    }),
    new webpack.BannerPlugin({
      banner: '#!/usr/bin/env node',
      raw: true,
    }),
  ],
}
