'use strict'
let WebSocketServer = require('ws').Server
let WebSocket = require('ws')
const PORT = 8000

// CloseEvent codes
const DATA_SYNTAX_ERROR = 4000
const DATA_UNKNOWN_ATTRIBUTE = 4001
const KEY_ALREADY_EXISTS = 4002
const KEY_UNKNOWN = 4003
const KEY_NO_LONGER_AVAILABLE = 4004

let server = new WebSocketServer({port: PORT}, () => {
  console.log('Server runs on: ws://localhost:' + PORT)
})

server.on('connection', (socket) => {
  socket.on('message', (data) => {
    let msg
    try {
      msg = JSON.parse(data)
    } catch (event) {
      socket.close(DATA_SYNTAX_ERROR, 'Server accepts only JSON')
    }
    try {
      if (msg.hasOwnProperty('key')) {
        for (let master of server.clients) {
          if (master.key === msg.key) {
            socket.close(KEY_ALREADY_EXISTS, 'The key already exists')
            return
          }
        }
        socket.key = msg.key
        socket.joiningClients = []
      } else if (msg.hasOwnProperty('id')) {
        for (let index in socket.joiningClients) {
          if (index === msg.id.toString()) {
            socket.joiningClients[index].send(JSON.stringify({data: msg.data}))
            return
          }
        }
        socket.send(JSON.stringify({id: msg.id, unavailable: true}))
      } else if (msg.hasOwnProperty('join')) {
        for (let master of server.clients) {
          if (master.key === msg.join) {
            socket.master = master
            master.joiningClients.push(socket)
            let id = master.joiningClients.length - 1
            master.send(JSON.stringify({id, data: msg.data}))
            return
          }
        }
        socket.close(KEY_UNKNOWN, 'Unknown key')
      } else if (msg.hasOwnProperty('data') && socket.hasOwnProperty('master')) {
        let id = socket.master.joiningClients.indexOf(socket)
        if (socket.master.readyState === WebSocket.OPEN) {
          socket.master.send(JSON.stringify({id, data: msg.data}))
        }
      } else {
        socket.close(DATA_UNKNOWN_ATTRIBUTE, 'Unsupported message format')
      }
    } catch (event) {
      socket.close(DATA_SYNTAX_ERROR, 'Server accepts only JSON')
    }
  })

  socket.on('close', (event) => {
    if (socket.hasOwnProperty('joiningClients')) {
      for (let client of socket.joiningClients) {
        client.close(KEY_NO_LONGER_AVAILABLE, 'The peer is no longer available')
      }
    }
  })
})

module.exports = server
