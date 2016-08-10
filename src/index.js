import {start} from './sigver'
const program = require('commander')

program
  .version('7.3.0', '-v, --version')
  .option('-h, --host <n>', 'specify host (DEFAULT: process.env.NODE_IP || "localhost")')
  .option('-p, --port <n>', 'specify port (DEFAULT: process.env.NODE_PORT || 8000)')
  .on('--help', () => {
    console.log(
`  Examples:

     $ sigver
     $ sigver -h 192.168.0.1 -p 9000
`)
  })
  .parse(process.argv)

start({host: program.host, port: program.port})
