'use strict'

let rollup = require('rollup')
let babel = require('rollup-plugin-babel')
let uglify = require('rollup-plugin-uglify')
let filesize = require('rollup-plugin-filesize')

rollup.rollup({
  entry: 'src/index.js',
  plugins: [
    babel({
      exclude: 'node_modules/**',
      presets: ['es2015-rollup']
    }),
    uglify(),
    filesize()
  ]
}).then((bundle) => {
  console.log('index.es5.min.js: ')
  bundle.write({banner: '#!/usr/bin/env node', dest: 'bin/index.es5.min.js'})
})

rollup.rollup({
  entry: 'src/sigver.js',
  plugins: [
    babel({
      exclude: 'node_modules/**',
      presets: ['es2015-rollup']
    }),
    filesize()
  ]
}).then((bundle) => {
  console.log('sigver.es5.umd.js: ')
  bundle.write({
    format: 'umd',
    moduleName: 'sigver',
    dest: 'dist/sigver.es5.umd.js'
  })
})
// {
//   output: {
//     comments: '#.*'
//   }
// }
