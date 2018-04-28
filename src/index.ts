/* tslint:disable:max-line-length */
import { Server as HttpServer } from 'http'
import { Server as HttpsServer } from 'https'
import { Subject } from 'rxjs/Subject'

import { Group } from './Group'
import { Peer } from './Peer'
import * as proto from './proto'
import { setupWebSocketServer } from './wsPeers'

// Retreive version from package.json
let version: string
try {
  version = require('../package.json').version
} catch (err) {
  version = ''
}

// Config LOGGER
global.log = require('bunyan').createLogger({
  name: 'sigver',
  level: 'trace',
})

// Default options for commander
const defaults = {
  host: '0.0.0.0',
  port: 8000,
  key: '',
  cert: '',
  ca: '',
}

const commander = require('commander')
  .version(version)
  .description(
    'Signaling server for WebRTC. Used by Netflux API (https://coast-team.github.io/netflux/)'
  )
  .option('-h, --host <ip>', `Select host address to bind to.`, defaults.host)
  .option('-p, --port <number>', `Select port to use.`, defaults.port)
  .option('-k, --key <file path>', `Private key for the certificate`)
  .option('-c, --cert <file path>', `The server certificate`)
  .option(
    '-a, --ca <file path>',
    `The additional intermediate certificate or certificates that web browsers will need in order to validate the server certificate.`
  )
  .on('--help', () => {
    console.log(
      `
  Examples:

     $ sigver                       # Server is listening on ws://0.0.0.0:8000
     $ sigver -h 192.168.0.1 -p 80  # Server is listening on ws://192.168.0.1:80
     $ sigver --key ./private.key --cert ./primary.crt --ca ./intermediate.crt --port 443  # Server is listening on wss://0.0.0.0:443`
    )
  })
  .parse(process.argv)

const { host, port, key, cert, ca } = commander

// Choose between HTTP & HTTPS
let httpServer: HttpServer | HttpsServer
if (key && cert && ca) {
  const fs = require('fs')
  httpServer = require('https').createServer({
    key: fs.readFileSync(key),
    cert: fs.readFileSync(cert),
    ca: fs.readFileSync(ca),
  })
} else {
  httpServer = require('http').createServer()
}

// Setup main signaling logic
const peers = new Subject<Peer>()
const groups = new Map<string, Group>()
peers.subscribe(
  (peer: Peer) => {
    peer.subscribe((msg: proto.Message) => {
      switch (msg.type) {
        case 'check': {
          const { myId, members } = msg.check as proto.Check
          let connected = false
          const group = groups.get(peer.key)
          if (group) {
            if (members.length === 0) {
              connected = group.subscribeToOrReplaceMember(peer)
            } else if (group.isConnectedToAtLeastOneMember(members)) {
              peer.id = myId
              connected = group.addMember(peer)
            } else {
              group.removeMember(peer)
              connected = group.subscribeToOrReplaceMember(peer)
            }
          } else {
            peer.id = myId
            groups.set(peer.key, new Group(peer, () => groups.delete(peer.key)))
            connected = true
          }
          if (connected) {
            peer.sendConnectedTrue()
          } else {
            peer.sendConnectedFalse()
          }
          break
        }
        case 'heartbeat':
          peer.missedHeartbeat = 0
          break
      }
    })
  },
  (err: Error) => log.fatal('WebSocket server peers error', err)
)

// Start listen
setupWebSocketServer(httpServer, peers)

httpServer.listen(port, host, () => {
  const address = httpServer.address()
  log.info(`Signaling server is listening on ${address.address}:${address.port}`)
})
