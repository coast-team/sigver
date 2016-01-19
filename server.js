'use strict'
let WebSocketServer = require('ws').Server
const PORT = 8000

let wss = new WebSocketServer({port: PORT}, () => {
  console.log('Server runs on: ws://localhost:' + PORT)
})

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    let obj = JSON.parse(message)

    // Check income message format
    if (obj.hasOwnProperty('type')) {
      if (obj.type === 'icecandidate' || obj.type === 'offer') {
        // If 'index' property exists then this message comes from the peer
        // who triggered connection
        if (obj.hasOwnProperty('index')) {
          ws.peers[obj.index].send(message)
        } else {
          // Otherwise it comes from one of peers wishing to connect
          ws.peer.send(message)
        }
        return
      } else if (obj.type === 'open') {
        return _open(ws, obj.key)
      } else if (obj.type === 'join') {
        return _join(ws, obj.key)
      }
    }

    // Close web socket if income message format is unknown
    ws.close()
  })
})

/**
 * Handles 'open' request from a client.
 *
 * @param  {WebSocket} ws web socket of a peer who triggered connection
 * @param  {string} key identifier sent by him
 * @return {void}
 */
function _open (ws, key) {
  for (let i in wss.clients) {
    if (wss.clients[i].key === key) {
      ws.close()
    }
  }
  ws.key = key
  ws.peers = []
}

/**
 * Handles 'join' request from a client.
 *
 * @param  {WebScoket} ws web socket of a peer wishing to connect
 * @param  {string} key identifier of connection
 * @return {void}
 */
function _join (ws, key) {
  for (let i in wss.clients) {
    if (wss.clients[i].key === key) {
      ws.peer = wss.clients[i]
      wss.clients[i].peers.push(ws)
      wss.clients[i].send('{"type":"join"}')
      return
    }
  }
  ws.close()
}

module.exports = wss
