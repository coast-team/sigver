import { Subject } from 'rxjs/Subject'

import { Message } from './Protobuf'
import { Peer } from './Peer'
import { SigError, ERR_KEY, ERR_MESSAGE } from './SigError'

const url = require('url')
const KEY_LENGTH_LIMIT = 512
const heartBeatMsg = Message.encode(Message.create({ heartbeat: true })).finish()

/**
 * WebSocket server able to use ws or uws modules.
 */
export default class WsServer {
  constructor (httpServer, host, port) {
    this.httpServer = httpServer
    this.host = host
    this.port = port
    this.peers = new Subject()
  }

  /**
   * Start the server.
   * @param {Function} cb Callback to execute after the server has been started
   */
  start (cb = () => {}) {
    this.httpServer.listen(this.port, this.host, cb)
    const WebSocketServer = require('uws').Server

    // Starting server
    this.server = new WebSocketServer({
      perMessageDeflate: false,
      server: this.httpServer
    })

    this.server.on('error', err => {
      log.error('Server error', err)
      this.peers.error(err)
    })

    this.server.on('connection', socket => {
      const { pathname } = url.parse(socket.upgradeReq.url, true)

      // Check key
      const key = pathname.substr(1)
      try {
        this.validateKey(key)
      } catch (err) {
        log.debug('Validate key error ' + err.code, err.message)
        socket.close(err.code, err.message)
      }

      // Initialize peer
      const peer = new Peer(key)

      // Socket config
      socket.binaryType = 'arraybuffer'
      socket.onmessage = evt => {
        try {
          peer.next(Message.decode(new Uint8Array(evt.data)))
        } catch (err) {
          log.error('Socket "onmessage" error', err)
          socket.close(ERR_MESSAGE, err.message)
        }
      }
      socket.onerror = err => peer.error(err)
      socket.onclose = closeEvt => {
        peer.complete()
        if (closeEvt.code !== 1000) {
          log.info('Socket closed', {id: peer.id, key, code: closeEvt.code, reason: closeEvt.reason})
        }
      }

      // Peer config
      peer.send = msg => {
        try {
          socket.send(Message.encode(Message.create(msg)).finish(), {binary: true})
        } catch (err) {
          log.error('Socket "send" error', err)
          socket.close(ERR_MESSAGE, err.message)
        }
      }
      peer.close = (code, reason) => socket.close(code, reason)
      peer.heartbeat = () => socket.send(heartBeatMsg, {binary: true})
      this.peers.next({ peer, key })
    })
  }

  validateKey (key) {
    if (key === '') {
      throw new SigError(ERR_KEY, `The key ${key} is an empty string`)
    }
    if (key.length > KEY_LENGTH_LIMIT) {
      throw new SigError(ERR_KEY,
        `The key length exceeds the limit of ${KEY_LENGTH_LIMIT} characters`
      )
    }
  }

  close (cb) {
    if (this.server !== null) {
      log.info('Server has stopped successfully')
      this.server.close(cb)
      this.peers.complete()
    }
  }
}
