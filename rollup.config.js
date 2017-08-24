import filesize from 'rollup-plugin-filesize'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import replace from 'rollup-plugin-re'

export default {
  input: 'src/index.js',
  output: {
    file: 'server.js',
    format: 'iife',
    banner: '#!/usr/bin/env node'
  },
  plugins: [
    replace({
      patterns: [
        {
          test: /eval.*\(moduleName\);/g,
          replace: 'undefined;'
        }
      ]
    }),
    resolve(),
    commonjs({
      namedExports: { 'node_modules/protobufjs/minimal.js': [ 'Reader', 'Writer', 'util', 'roots' ] }
    }),
    filesize()
  ]
}
