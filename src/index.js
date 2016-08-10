import {start} from './sigver'
const program = require('commander')

let host = process.env.NODE_IP || 'localhost'
let port = process.env.NODE_PORT || 8000

program
  .version('7.4.2', '-v, --version')
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

if (program.host) host = program.host
if (program.port) port = program.port
start(host, port)
