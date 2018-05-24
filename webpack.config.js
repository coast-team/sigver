const nodeExternals = require('webpack-node-externals')
const webpack = require('webpack')

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
    new webpack.BannerPlugin({
      banner: '#!/usr/bin/env node',
      raw: true,
    }),
  ],
}
