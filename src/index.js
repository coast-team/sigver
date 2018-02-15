import WsServer from './WsServer'
// import SseServer from './SseServer'
import ServerCore from './ServerCore'

// Retreive version from package.json
let version
try {
  version = require('./package.json').version
} catch (err) {
  version = ''
}

// Config LOGGER
global.log = require('bunyan').createLogger({
  name: 'sigver',
  level: 'trace'
})

const program = require('commander')

const defaults = {
  host: '0.0.0.0',
  port: 8000,
  key: '',
  cert: '',
  ca: ''
}

program
  .version(version)
  .description('Signaling server for WebRTC. Used by Netflux API (https://coast-team.github.io/netflux/)')
  .option('-h, --host <ip>', `Select host address to bind to.`, defaults.host)
  .option('-p, --port <number>', `Select port to use.`, defaults.port)
  .option('-k, --key <file path>',
    `Private key for the certificate`)
  .option('-c, --cert <file path>',
    `The server certificate`)
  .option('-a, --ca <file path>',
    `The additional intermediate certificate or certificates that web browsers will need in order to validate the server certificate.`)
  .on('--help', () => {
    console.log(
      `
  Examples:

     $ sigver                       # Server is listening on ws://0.0.0.0:8000
     $ sigver -h 192.168.0.1 -p 80  # Server is listening on ws://192.168.0.1:80
     $ sigver --key ./private.key --cert ./primary.crt --ca ./intermediate.crt --port 443  # Server is listening on wss://0.0.0.0:443`)
  })
  .parse(process.argv)

const {host, port, key, cert, ca} = program

const core = new ServerCore()

let httpServer
if (key && cert && ca) {
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
  peer => core.init(peer),
  err => log.fatal('WebSocket server peers error', err)
)
wsServer.start(() => {
  const address = httpServer.address()
  log.info(`WebSocket server is listening on ${address.address}:${address.port}`)
})
