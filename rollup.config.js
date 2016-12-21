'use strict'

const rollup = require('rollup')
const babel = require('rollup-plugin-babel')
const filesize = require('rollup-plugin-filesize')

rollup.rollup({
  entry: 'src/index.js',
  plugins: [
    babel({
      exclude: 'node_modules/**',
      presets: ['es2015-rollup']
    }),
    filesize()
  ]
}).then((bundle) => {
  console.log('server.js: ')
  bundle.write({
    format: 'iife',
    banner: '#!/usr/bin/env node',
    dest: 'server.js'})
})
