'use strict'
let WebSocketServer = require('ws').Server
const PORT = 8000
const UNSUPPORTED_DATA = 1007
const POLICY_VIOLATION = 1008
const CLOSE_UNSUPPORTED = 1003

let server = new WebSocketServer({port: PORT}, () => {
  console.log('Server runs on: ws://localhost:' + PORT)
})

server.on('connection', (socket) => {
  socket.on('message', (message) => {
    try {
      let msg = JSON.parse(message)

      if (msg.hasOwnProperty('key')) {
        for (let client of server.clients) {
          if (client.key === msg.key) {
            socket.close(POLICY_VIOLATION, 'The key already exists')
            return
          }
        }
        socket.key = msg.key
        socket.clientsWannaJoin = new Set()
      } else if (msg.hasOwnProperty('joinkey')) {
        for (let client of server.clients) {
          if (client.key === msg.joinkey) {
            socket.initiator = client
            client.clientsWannaJoin.add(socket)
            socket.send('{"reachable":"true"}')
            return
          }
        }
        socket.close(POLICY_VIOLATION, 'The key does not exist')
      } else if (msg.hasOwnProperty('offer')) {
        if (socket.hasOwnProperty('initiator')) {
          socket.initiator.send(JSON.stringify({offer: msg.offer}))
        } else {
          socket.close(POLICY_VIOLATION, 'Joinkey request has not been sent')
        }
      } else if (msg.hasOwnProperty('answer')) {
        for (let client of socket.clientsWannaJoin) {
          client.send(JSON.stringify({answer: msg.answer}))
        }
        socket.clientsWannaJoin.clear()
      } else {
        socket.close(UNSUPPORTED_DATA, 'Unsupported message format')
      }
    } catch (event) {
      socket.close(CLOSE_UNSUPPORTED, 'Server accepts only JSON')
    }
  })
})

module.exports = server
