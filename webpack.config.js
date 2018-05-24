const nodeExternals = require('webpack-node-externals')
const webpack = require('webpack')

module.exports = {
  mode: 'production',
  entry: './src/index.ts',
  output: {
    filename: 'server.js',
  },
  target: 'node',
  externals: [nodeExternals()],
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
