import babel from 'rollup-plugin-babel'
import filesize from 'rollup-plugin-filesize'

export default {
  entry: 'src/index.js',
  dest: 'server.js',
  format: 'iife',
  banner: '#!/usr/bin/env node',
  plugins: [
    babel({
      exclude: 'node_modules/**',
      presets: ['es2015-rollup']
    }),
    filesize()
  ]
}
