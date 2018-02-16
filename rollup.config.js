import filesize from 'rollup-plugin-filesize'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import replace from 'rollup-plugin-re'
import typescript from 'rollup-plugin-typescript2'

export default {
  input: 'src/index.ts',
  output: [{
    file: 'server.js',
    format: 'cjs',
    banner: '#!/usr/bin/env node'
  }],
  plugins: [
    typescript(),
    replace({
      patterns: [
        {
          test: /eval.*\(moduleName\);/g,
          replace: 'undefined;'
        }
      ]
    }),
    resolve({ preferBuiltins: false }),
    commonjs({
      namedExports: { 'node_modules/protobufjs/minimal.js': [ 'Reader', 'Writer', 'util', 'roots' ] }
    }),
    filesize()
  ]
}
