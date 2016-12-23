import filesize from 'rollup-plugin-filesize'

export default {
  entry: 'src/index.js',
  dest: 'server.js',
  format: 'iife',
  banner: '#!/usr/bin/env node',
  plugins: [ filesize() ]
}
