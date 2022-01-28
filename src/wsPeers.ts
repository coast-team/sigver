import type { Server as HttpServer } from 'http'
import type { Server as HttpsServer } from 'https'
import * as URL from 'url'
import WebSocket from 'ws'

import { log } from './logger.js'
import { Peer } from './peer.js'
import { ERR_URL, SigError, validateKey, ERR_MESSAGE } from './sig-error.js'

export function setupWebSocketServer(httpServer: HttpServer | HttpsServer): WebSocket.Server {
  // Configure server
  const wss = new WebSocket.Server({
    perMessageDeflate: false,
    server: httpServer,
  })

  wss.on('error', (err) => log.fatal('WebSocketServer error', err))

  wss.on('connection', (socket, request) => {
    try {
      // Get and validate the key
      if (request.url === undefined) {
        throw new Error('URL is undefined')
      }
      const { key, favored } = parseURL(request.url)
      validateKey(key)

      // Initialize peer object
      const peer = new Peer(
        key,
        favored,
        (bytes) => {
          try {
            socket.send(bytes)
          } catch (err) {
            log.error('Fail to send data', err.message)
            socket.close(ERR_URL, err.message)
          }
        },
        (code, reason) => socket.close(code, reason)
      )

      // Handle socket callbacks
      socket.onmessage = ({ data }) => {
        if (data instanceof Uint8Array) {
          peer.onMessage(data)
        } else {
          log.error('Wrong data type')
          peer.close(ERR_MESSAGE, 'Wrong data type')
        }
      }
      socket.onerror = (err) => peer.error(err)
      socket.onclose = () => peer.onClose()
    } catch (err) {
      log.error('WebSocket connection error: ', err.message)
      socket.close(err.code, err.message)
    }
  })
  return wss
}

function parseURL(url: string): { key: string; favored: boolean } {
  const { pathname, query } = URL.parse(url, true)
  if (pathname == null) {
    throw new SigError(ERR_URL, 'URL pathname is undefined')
  }
  return { key: pathname.slice(1), favored: 'favored' in query }
}
