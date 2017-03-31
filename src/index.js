import WsServer from './WsServer'
// import SseServer from './SseServer'
import ServerCore from './ServerCore'
const program = require('commander')

let host = process.env.NODE_IP || '0.0.0.0'
let port = process.env.NODE_PORT || 8000
let type = 'ws'
let wsLib = 'uws'

program
  .version('8.1.0', '-v, --version')
  .option('-h, --host <n>', 'Select host address to bind to, DEFAULT: process.env.NODE_IP || "0.0.0.0"')
  .option('-p, --port <n>', 'Select port to use, DEFAULT: process.env.NODE_PORT || 8000\n')
  .option('-t, --type <value>',
`Specify the server type. The possible values are:
    ws - for WebSocket only ("ws://host:port"). This is DEFAULT
    sse - for Server-Sent-Event only ("http://host:port")
`)
  .option('-w, --wsLib <value>',
`Available only when the option -t/--type is equal to ws. Specify the server module to use for WebSocket server. The possible values are:
    ws - https://github.com/websockets/ws
    uws - https://github.com/uWebSockets/uWebSockets. This is DEFAULT, if the module has not been installed properly or no binary is available for the current OS, then ws will be used instead`)
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
if (program.wsLib) wsLib = program.wsLib

const core = new ServerCore()

switch (type) {
  case 'ws': {
    const wsServer = new WsServer()
    wsServer.onChannel.subscribe(channel => core.init(channel),
      (err) => console.log('my errorerlsj: ' + err))
    wsServer.start({host, port}, () => {
      console.log(`WebSocket server is listening on: ws://${host}:${port}`)
    }, {wsLib})
    break
  }
  // case 'sse': {
  //   const sseServer = new SseServer()
  //   sseServer.start({host, port}, () => {
  //     console.log(`EventSource server is listening on: http://${host}:${port}`)
  //   })
  //   break
  // }
}
