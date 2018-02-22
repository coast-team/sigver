/* tslint:disable:max-line-length */
import { Server as HttpServer } from 'http'
import { Server as HttpsServer } from 'https'
import { Subject } from 'rxjs/Subject'

import { Group } from './Group'
import { Peer } from './Peer'
import { WsServer } from './WsServer'

// Retreive version from package.json
let version: string
try {
  version = require('./package.json').version
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

const {host, port, key, cert, ca} = commander

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
    bindToMember(peer)

    // Subscribe to peer messages
    peer.subscribe(({ type }) => {
      switch (type) {
      case 'stable':
        becomeMember(peer)
        break
      case 'heartbeat':
        peer.missedHeartbeat = 0
        break
      case 'tryAnother': {
        bindToMember(peer)
        break
      }
      }
    })
  },
  (err: Error) => log.fatal('WebSocket server peers error', err),
)

function bindToMember (peer: Peer) {
  const group = groups.get(peer.key)

  // Check whether the first peer or not in the group identified by the key
  if (group) {
    if (group.oneLeftAndAlreadyTried(peer)) {
      log.info('ONE LEFT AND ALREADY TRIED: switch peers', { key: peer.key})
      group.switchPeers(peer)
      peer.sendFirstTrue()
    } else {
      peer.bindWith(group.selectMemberFor(peer))
      peer.sendFirstFalse()
    }
  } else {
    groups.set(peer.key, new Group(peer, () => groups.delete(peer.key)))
    peer.sendFirstTrue()
  }
}

function becomeMember (peer: Peer) {
  if (peer.group === undefined) {
    const group = groups.get(peer.key)
    if (group) {
      group.addMember(peer)
    } else {
      groups.set(peer.key, new Group(peer, () => groups.delete(peer.key)))
    }
  }
}

// Start listen
const wsServer = new WsServer(httpServer, host, port, peers)
wsServer.start(() => {
  const address = httpServer.address()
  log.info(`WebSocket server is listening on ${address.address}:${address.port}`)
})
