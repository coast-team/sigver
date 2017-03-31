import filesize from 'rollup-plugin-filesize'
import nodeResolve from 'rollup-plugin-node-resolve'

export default {
  entry: 'src/index.js',
  dest: 'server.js',
  format: 'iife',
  banner: '#!/usr/bin/env node',
  plugins: [
    nodeResolve({
      module: true,
      jsnext: true
    }),
    filesize()
  ]
}
