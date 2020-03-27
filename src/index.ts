import commander from 'commander'
import fs from 'fs'
import type { Server as HttpServer } from 'http'
import type { Server as HttpsServer } from 'https'
import http from 'http'
import https from 'https'

import { log } from './logger'
import { setupWebSocketServer } from './wsPeers'

// Retreive version from package.json
let version: string
try {
  version = require('../package.json').version
} catch (err) {
  try {
    version = require('./package.json').version
  } catch (err) {}
  version = ''
}

// Default options for cli
const defaults = {
  host: '0.0.0.0',
  port: '8000',
  key: '',
  cert: '',
  ca: '',
}

commander
  .version(version)
  .description(
    'Signaling server for WebRTC. Used by Netflux API (https://coast-team.github.io/netflux/)'
  )
  .option('-h, --host <ip>', `Select host address to bind to`, defaults.host)
  .option('-p, --port <number>', `Select port to use`, defaults.port)
  .option('-k, --key <file path>', `Private key for the certificate.`)
  .option('-c, --cert <file path>', `The server certificate.`)
  .option(
    '-a, --ca <file path>',
    `The additional intermediate certificate or certificates that web browsers will need in order to validate the server certificate.`
  )
  .on('--help', () => {
    console.log(
      `
Examples:

  $ sigver                       # Signaling server is listening on 0.0.0.0:8000
  $ sigver -h 192.168.0.1 -p 80  # Signaling server is listening on 192.168.0.1:80
  $ sigver --key ./private.key --cert ./primary.crt --ca ./intermediate.crt --port 443  # Signaling server is listening on 0.0.0.0:443`
    )
  })
  .parse(process.argv)

// Get user cli options
const { host, port, key, cert, ca } = commander

// Create HTTP or HTTPS server
let httpServer: HttpServer | HttpsServer
if (key && cert && ca) {
  httpServer = https.createServer({
    key: fs.readFileSync(key),
    cert: fs.readFileSync(cert),
    ca: fs.readFileSync(ca),
  })
} else {
  httpServer = http.createServer()
}

// Setup WebSocket server
setupWebSocketServer(httpServer)

// Handle httpServer callbacks and start listen
httpServer.on('clientError', (err, socket) => {
  log.fatal('Client error: ', err)
  socket.end()
})

httpServer.listen(port, host, () => {
  const address = httpServer.address()
  if (address == null) {
    log.fatal('Signaling server has no address')
  } else if (typeof address === 'string') {
    console.log(`Signaling server is listening on ${address}`)
  } else {
    console.log(`Signaling server is listening on ${address.address}:${address.port}`)
  }
})
