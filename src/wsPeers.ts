/// <reference types="node"/>
import { Server as HttpServer } from 'http'
import { Server as HttpsServer } from 'https'
import { Subject } from 'rxjs/Subject'
import * as URL from 'url'
import * as WebSocket from 'uws'

import { Peer } from './Peer'
import { ERR_MESSAGE, ERR_NO_KEY, SigError, validateKey } from './Util'

export function setupWebSocketServer(
  httpServer: HttpServer | HttpsServer,
  peers: Subject<Peer>
): WebSocket.Server {
  // Configure server
  const wss = new WebSocket.Server({
    perMessageDeflate: false,
    server: httpServer,
  })

  wss.on('error', (err) => log.fatal('WebSocketServer error', err))

  wss.on('connection', (socket) => {
    try {
      const key = getKey(socket.upgradeReq.url)
      validateKey(key)

      // Initialize peer
      const peer = new Peer(
        key,
        (bytes) => {
          try {
            socket.send(bytes, { binary: true })
          } catch (err) {
            log.error('Close socket', err)
            socket.close(ERR_MESSAGE, err.message)
          }
        },
        (code, reason) => socket.close(code, reason),
        (bytes) => socket.send(bytes, { binary: true })
      )

      // Socket config
      socket.onmessage = ({ data }) => peer.onMessage(data)
      socket.onerror = (err) => peer.error(err)
      socket.onclose = (closeEvt) => peer.onClose(closeEvt.code, closeEvt.reason)

      peers.next(peer)
    } catch (err) {
      log.error('Close socket: ', err)
      socket.close(err.code, err.message)
    }
  })
  return wss
}

function getKey(url: string | undefined): string {
  if (url === undefined) {
    throw new SigError(ERR_NO_KEY, 'Could not get the key: the URL is undefined')
  }
  const { pathname } = URL.parse(url, true)
  if (!pathname) {
    throw new SigError(ERR_NO_KEY, 'Could not get the key: the URL is undefined')
  }
  return pathname.substr(1)
}
