const esbuild = require('esbuild')
const packagejson = require('./package.json')

const SIGVER_VERSION = packagejson.version

esbuild.buildSync({
  entryPoints: ['./src/index.ts'],
  bundle: true,
  minify: true,
  platform: 'node',
  format: 'cjs',
  outExtension: { '.js': '.cjs' },
  outfile: './dist/server.js',
  sourcemap: process.env['NODE_ENV'] === 'development',
  external: ['bufferutil', 'commander', 'loglevel', 'protobufjs', 'rxjs', 'ws'],
  define: {
    SIGVER_VERSION: JSON.stringify(SIGVER_VERSION),
  },
})
