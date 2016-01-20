'use strict'
let WebSocketServer = require('ws').Server
const PORT = 8000
const UNSUPPORTED_DATA = 1007
const POLICY_VIOLATION = 1008

let server = new WebSocketServer({port: PORT}, () => {
  console.log('Server runs on: ws://localhost:' + PORT)
})

server.on('connection', (socket) => {
  socket.on('message', (message) => {
    let msg = JSON.parse(message)
    // Check income message format. Type attribute value must be either 'open'
    // or 'join', otherwise socket is closed with UNSUPPORTED_DATA event.
    if (msg.hasOwnProperty('type') && msg.hasOwnProperty('key')) {
      if (msg.type === 'join') {
        _join(socket, msg.key)
      } else if (msg.type === 'open') {
        _open(socket, msg.key)
      } else {
        socket.close(UNSUPPORTED_DATA, 'Unsupported data format')
      }
      // If index attribute exists that means that this message come from the
      // peer who triggered connection and must be forwarded to the peer who
      // wish to connected and who is identified by 'index'
    } else if (msg.hasOwnProperty('index')) {
      socket.peersWannaJoin[msg.index].send(message)
      // Otherwise if the peer to whom this peer wants to connect (initiator)
      //  exists then just forward message
    } else if (socket.hasOwnProperty('initiator')) {
      msg.index = socket.index
      socket.initiator.send(JSON.stringify(msg))
    } else {
      socket.close(POLICY_VIOLATION, 'The first message received from any socket must contain "type" and "key" attributes')
    }
  })
})

/**
 * Handles 'open' request from a client.
 *
 * @param  {WebSocket} socket web socket of a peer who triggered connection
 * @param  {string} key identifier sent by him
 * @return {void}
 */
function _open (socket, key) {
  for (let i in server.clients) {
    if (server.clients[i].key === key) {
      socket.close(POLICY_VIOLATION, 'Another web socket with the same key has been created')
    }
  }
  socket.key = key
  socket.peersWannaJoin = []
}

/**
 * Handles 'join' request from a client.
 *
 * @param  {WebScoket} socket web socket of a peer wishing to connect
 * @param  {string} key identifier of connection
 * @return {void}
 */
function _join (socket, key) {
  for (let i in server.clients) {
    if (server.clients[i].key === key) {
      socket.initiator = server.clients[i]
      socket.index = i
      socket.initiator.peersWannaJoin.push(socket)
      socket.initiator.send('{"type":"join"}')
      return
    }
  }
  socket.close(POLICY_VIOLATION, 'The provided key is not available')
}

module.exports = server
