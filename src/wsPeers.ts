/// <reference types="node"/>
import { Server as HttpServer } from 'http'
import { Server as HttpsServer } from 'https'
import * as URL from 'url'
import * as WebSocket from 'uws'

import { Peer } from './peer'
import { ERR_URL, SigError, validateKey } from './util'

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
      if (!socket.upgradeReq.url) {
        throw new Error('URL is undefined')
      }
      const { key, favored } = parseURL(socket.upgradeReq.url)
      validateKey(key)

      // Initialize peer object
      const peer = new Peer(
        key,
        favored,
        (bytes) => {
          try {
            socket.send(bytes, { binary: true })
          } catch (err) {
            log.error('Faild to send', err.message)
            socket.close(ERR_URL, err.message)
          }
        },
        (code, reason) => socket.close(code, reason)
      )

      // Handle socket callbacks
      socket.onmessage = ({ data }) => peer.onMessage(data)
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
  if (!pathname) {
    throw new SigError(ERR_URL, 'URL pathname is undefined')
  }
  return { key: pathname.substr(1), favored: 'favored' in query }
}
