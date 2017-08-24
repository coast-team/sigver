import WsServer from './WsServer'
// import SseServer from './SseServer'
import ServerCore from './ServerCore'

// Config LOGGER
global.log = require('bunyan').createLogger({
  name: 'sigver',
  level: 'trace'
})

const program = require('commander')

const defaults = {
  host: '0.0.0.0',
  port: 8000,
  secure: false,
  key: '',
  cert: '',
  ca: ''
}

program
  .option('-h, --host <n>', `Select host address to bind to. Default: ${defaults.host}\n`, defaults.host)
  .option('-p, --port <n>', `Select port to use, Default: 8000\n'`, defaults.port)
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

const {host, port, secure, key, cert, ca} = program

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
wsServer.peers.subscribe(
  channel => core.init(channel),
  err => log.fatal('WebSocket server peers error', err)
)
wsServer.start(() => {
  const address = httpServer.address()
  log.info(`WebSocket server is listening on ${address.address}:${address.port}`)
})
