import filesize from 'rollup-plugin-filesize'
import babel from 'rollup-plugin-babel'

export default {
  entry: 'src/index_ws.js',
  dest: 'lib/signaling_ws.cjs.js',
  format: 'cjs',
  plugins: [
    filesize(),
    babel({
      exclude: 'node_modules/**'
    })
  ]
}
