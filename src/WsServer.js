import { Subject } from 'rxjs/Subject'

import { Peer } from './Peer'
import { SigError, ERR_KEY, ERR_MESSAGE } from './SigError'

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
      const peer = new Peer(
        key,
        bytes => {
          try {
            socket.send(bytes, {binary: true})
          } catch (err) {
            log.error('Socket "send" error', err)
            socket.close(ERR_MESSAGE, err.message)
          }
        },
        (code, reason) => socket.close(code, reason),
        (bytes) => socket.send(bytes, {binary: true})
      )

      // Socket config
      socket.binaryType = 'arraybuffer'
      socket.onmessage = evt => peer.onMessage(evt.data)
      socket.onerror = err => peer.error(err)
      socket.onclose = closeEvt => peer.onClose(closeEvt.code, closeEvt.reason)

      this.peers.next(peer)
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
