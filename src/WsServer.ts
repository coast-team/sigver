import { Server as HttpServer } from 'http'
import { Server as HttpsServer } from 'https'
import { Subject } from 'rxjs/Subject'
import { Server } from 'uws'

import { Peer } from './Peer'
import { ERR_KEY, ERR_MESSAGE, SigError } from './SigError'

const url = require('url')
const KEY_LENGTH_LIMIT = 512

/**
 * WebSocket server able to use ws or uws modules.
 */
export class WsServer {
  readonly host: string
  readonly port: number

  private httpServer: HttpServer | HttpsServer
  private webSocketServer: Server | undefined
  private peers: Subject<Peer>

  constructor (
    httpServer: HttpServer | HttpsServer,
    host: string,
    port: number,
    peers: Subject<Peer>,
  ) {
    this.httpServer = httpServer
    this.host = host
    this.port = port
    this.peers = peers
  }

  /**
   * Start the server.
   * @param {Function} cb Callback to execute after the server has been started
   */
  start (cb = () => {}) {
    this.httpServer.listen(this.port, this.host, cb)

    const WebSocketServer = require('uws').Server

    // Starting server
    const wss: Server = new WebSocketServer({
      perMessageDeflate: false,
      server: this.httpServer,
    })
    this.webSocketServer = wss

    wss.on('error', (err) => log.error('Server error', err))

    wss.on('connection', (socket) => {
      const { pathname } = url.parse(socket.upgradeReq.url, true)

      // Check key
      const key = pathname.substr(1)
      try {
        this.validateKey(key)
      } catch (err) {
        log.error('Validate key error ', err)
        socket.close(err.code, err.message)
      }

      // Initialize peer
      const peer = new Peer(
        key,
        (bytes) => {
          try {
            socket.send(bytes, {binary: true})
          } catch (err) {
            log.error('Socket "send" error', err)
            socket.close(ERR_MESSAGE, err.message)
          }
        },
        (code, reason) => socket.close(code, reason),
        (bytes) => socket.send(bytes, {binary: true}),
      )

      // Socket config
      socket.onmessage = (evt) => peer.onMessage(evt.data)
      socket.onerror = (err) => peer.error(err)
      socket.onclose = (closeEvt) => peer.onClose(closeEvt.code, closeEvt.reason)

      this.peers.next(peer)
    })
  }

  close (cb: any) {
    if (this.webSocketServer) {
      log.info('Server has stopped successfully')
      this.webSocketServer.close(cb)
    }
  }

  private validateKey (key: string) {
    if (key === '') {
      throw new SigError(ERR_KEY, `The key ${key} is an empty string`)
    }
    if (key.length > KEY_LENGTH_LIMIT) {
      throw new SigError(ERR_KEY,
        `The key length exceeds the limit of ${KEY_LENGTH_LIMIT} characters`,
      )
    }
  }
}
