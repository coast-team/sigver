import WSServer from './WSServer'
import SSEServer from './SSEServer'
const program = require('commander')

let host = process.env.NODE_IP || '0.0.0.0'
let port = process.env.NODE_PORT || 8000
let type = 'ws'

program
  .version('8.1.0', '-v, --version')
  .option('-h, --host <n>', 'select host address to bind to, DEFAULT: process.env.NODE_IP || "0.0.0.0"')
  .option('-p, --port <n>', 'select port to use, DEFAULT: process.env.NODE_PORT || 8000')
  .option('-t, --type <value>',
`specify the server type. The possible values are:
  ws - for WebSocket only ("ws://host:port"). This is DEFAULT
  sse - for Server-Sent-Event only ("http://host:port")
`)
  .on('--help', () => {
    console.log(
`  Examples:

     $ sigver                         # Server is listening on ws://0.0.0.0:8000
     $ sigver -h 192.168.0.1 -p 9000  # Server is listening on ws://192.168.0.1:9000
     $ sigver -t sse -p 9000          # Server is listening on http://0.0.0.0:9000
`)
  })
  .parse(process.argv)

if (program.host) host = program.host
if (program.port) port = program.port
if (program.type) type = program.type

switch (type) {
  case 'ws':
    WSServer.start({host, port}, () => {
      console.log(`Server is listening on: ws://${host}:${port}`)
    })
    break
  case 'sse':
    SSEServer.start({host, port}, () => {
      console.log(`Server is listening on: http://${host}:${port}`)
    })
    break
}
