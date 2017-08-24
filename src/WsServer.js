import { Message } from './Protobuf'
import Peer from './Peer'
import SigverError from './SigverError'

const url = require('url')
const KEY_LENGTH_LIMIT = 512

/**
 * WebSocket server able to use ws or uws modules.
 */
export default class WsServer {
  constructor (httpServer, host, port) {
    this.httpServer = httpServer
    this.host = host
    this.port = port
    const Subject = require('rxjs/Rx').Subject
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
        socket.close(err.code, err.message)
      }

      // Initialize peer
      const peer = new Peer(key)
      socket.binaryType = 'arraybuffer'
      socket.onmessage = evt => {
        try {
          peer.next(Message.decode(new Uint8Array(evt.data)))
        } catch (err) {
          log.error(err)
          socket.close(err.code, err.message)
        }
      }
      socket.onerror = err => peer.error(err)
      socket.onclose = closeEvt => {
        if (closeEvt.code === 1000) {
          peer.complete()
        } else {
          peer.error(new SigverError(closeEvt.code, closeEvt.reason))
        }
      }
      peer.send = msg => {
        const bytes = Message.encode(Message.create(msg)).finish()
        socket.send(bytes, {binary: true})
      }
      peer.close = (code, reason) => socket.close(code, reason)
      this.peers.next({ peer, key })
    })
  }

  validateKey (key) {
    if (key === '') {
      throw new SigverError(SigverError.KEY_ERROR, `The key ${key} is an empty string`)
    }
    if (key.length > KEY_LENGTH_LIMIT) {
      throw new SigverError(SigverError.KEY_ERROR,
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
