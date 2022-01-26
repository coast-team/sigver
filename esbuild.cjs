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
  external: ['bufferutil', 'commander', 'pino', 'protobufjs', 'rxjs', 'ws'],
  define: {
    SIGVER_VERSION: JSON.stringify(SIGVER_VERSION),
  },
})
