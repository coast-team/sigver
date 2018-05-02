/// <reference types="node"/>
import { Server as HttpServer } from 'http'
import { Server as HttpsServer } from 'https'
import * as URL from 'url'
import * as WebSocket from 'uws'

import { Peer } from './peer'
import { ERR_MESSAGE, SigError, validateKey } from './util'

export function setupWebSocketServer(httpServer: HttpServer | HttpsServer): WebSocket.Server {
  // Configure server
  const wss = new WebSocket.Server({
    perMessageDeflate: false,
    server: httpServer,
  })

  wss.on('error', (err) => log.fatal('WebSocketServer error', err))

  wss.on('connection', (socket) => {
    try {
      // Get and validate the key
      const key = getKey(socket.upgradeReq.url)
      validateKey(key)

      // Initialize peer object
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
        (code, reason) => socket.close(code, reason)
      )

      // Handle socket callbacks
      socket.onmessage = ({ data }) => peer.onMessage(data)
      socket.onerror = (err) => peer.error(err)
      socket.onclose = () => peer.onClose()
    } catch (err) {
      log.error('Close socket: ', err)
      socket.close(err.code, err.message)
    }
  })
  return wss
}

function getKey(url: string | undefined): string {
  const pathname = url !== undefined ? URL.parse(url, true).pathname : undefined
  if (!pathname) {
    throw new SigError(ERR_MESSAGE, 'Could not get the key: the URL is undefined')
  }
  return pathname.substr(1)
}
