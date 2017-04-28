import WsServer from './WsServer'
// import SseServer from './SseServer'
import ServerCore from './ServerCore'
import log from './log'

const program = require('commander')

const defaults = {
  host: '0.0.0.0',
  port: 8000,
  wsLib: 'uws',
  secure: false,
  key: '',
  cert: '',
  ca: ''
}

program
  .version('13.1.0', '-v, --version')
  .option('-h, --host <n>', `Select host address to bind to. Default: ${defaults.host}\n`, defaults.host)
  .option('-p, --port <n>', `Select port to use, Default: process.env.NODE_PORT || 8000\n'`, defaults.port)
  .option('-w, --wsLib <value>',
`Specify the server module to use for WebSocket server. The possible values are:
    ws - https://github.com/websockets/ws
    uws - https://github.com/uWebSockets/uWebSockets. This is DEFAULT, if the module has not been installed properly or no binary is available for the current OS, then ws will be used instead`, defaults.wsLib)
  .option('-s, --secure',
    `If present, server is listening on WSS instead of WS`)
  .option('-k, --key <value>',
    `Private key for the certificate`)
  .option('-c, --cert <value>',
    `The server certificate`)
  .option('-a, --ca <value>',
    `The additional intermediate certificate or certificates that web browsers will need in order to validate the server certificate.`)
  .on('--help', () => {
    console.log(
`  Examples:

     $ sigver                         # Server is listening on ws://0.0.0.0:8000
     $ sigver -h 192.168.0.1 -p 9000  # Server is listening on ws://192.168.0.1:9000
     $ sigver -p 9000                 # Server is listening on http://0.0.0.0:9000
`)
  })
  .parse(process.argv)

const {host, port, wsLib, secure, key, cert, ca} = program

const core = new ServerCore()

let httpServer
if (secure) {
  const fs = require('fs')
  httpServer = require('https').createServer({
    key: fs.readFileSync(key),
    cert: fs.readFileSync(cert),
    ca: fs.readFileSync(ca)
  })
} else {
  httpServer = require('http').createServer()
}

const wsServer = new WsServer(httpServer, host, port)
wsServer.onChannel.subscribe(
  channel => core.init(channel),
  err => log.fatal('WebSocket server onChannel error', err)
)
wsServer.start(() => {
  const address = httpServer.address()
  log.info(`WebSocket server is listening on ${address.address}:${address.port}`)
}, {wsLib})
  // case 'sse': {
  //   const sseServer = new SseServer()
  //   sseServer.start({host, port}, () => {
  //     console.log(`EventSource server is listening on: http://${host}:${port}`)
  //   })
  //   break
  // }
