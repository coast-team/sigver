import filesize from 'rollup-plugin-filesize'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

export default {
  entry: 'src/index.js',
  dest: 'server.js',
  format: 'iife',
  banner: '#!/usr/bin/env node',
  plugins: [
    resolve(),
    commonjs({
      namedExports: { 'node_modules/protobufjs/minimal.js': [ 'Reader', 'Writer', 'util', 'roots' ] }
    }),
    filesize()
  ]
}
