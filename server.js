let WebSocketServer = require('ws').Server
let WebSocket = require('ws')

// CloseEvent codes
const DATA_SYNTAX_ERROR = 4000
const DATA_UNKNOWN_ATTRIBUTE = 4001
const KEY_ALREADY_EXISTS = 4002
const KEY_UNKNOWN = 4003
const KEY_NO_LONGER_AVAILABLE = 4004

let settings = {
  host: process.env.NODE_IP || 'localhost',
  port: process.env.NODE_PORT || 8000
}
process.argv.forEach((value, index, array) => {
  if (value.match('-(h|-host)')) {
    settings.host = array[index + 1]
  } else if (value.match('-(p|-port)')) {
    settings.port = array[index + 1]
  }
})

let server = new WebSocketServer(settings, () => {
  console.log(`Server runs on: ws://${settings.host}:${settings.port}`)
})

server.on('connection', (socket) => {
  socket.on('message', (data) => {
    let msg
    try {
      msg = JSON.parse(data)
    } catch (event) {
      error(socket, DATA_SYNTAX_ERROR, 'Server accepts only JSON')
    }
    try {
      if ('key' in msg) {
        for (let master of server.clients) {
          if (master.key === msg.key) {
            error(socket, KEY_ALREADY_EXISTS, 'The key already exists')
            return
          }
        }
        socket.key = msg.key
        socket.joiningClients = []
      } else if ('id' in msg) {
        for (let index in socket.joiningClients) {
          if (index === msg.id.toString()) {
            socket.joiningClients[index].send(JSON.stringify({data: msg.data}))
            return
          }
        }
        socket.send(JSON.stringify({id: msg.id, unavailable: true}))
      } else if ('join' in msg) {
        for (let master of server.clients) {
          if (master.key === msg.join) {
            socket.master = master
            master.joiningClients.push(socket)
            let id = master.joiningClients.length - 1
            master.send(JSON.stringify({id, data: msg.data}))
            return
          }
        }
        error(socket, KEY_UNKNOWN, 'Unknown key')
      } else if ('data' in msg && 'master' in socket) {
        let id = socket.master.joiningClients.indexOf(socket)
        if (socket.master.readyState === WebSocket.OPEN) {
          socket.master.send(JSON.stringify({id, data: msg.data}))
        }
      } else {
        console.log('data: ', msg)
        error(socket, DATA_UNKNOWN_ATTRIBUTE, 'Unsupported message format')
      }
    } catch (event) {
      error(socket, DATA_SYNTAX_ERROR, 'erver accepts only JSON')
    }
  })

  socket.on('close', (event) => {
    if ('joiningClients' in socket) {
      for (let client of socket.joiningClients) {
        client.close(KEY_NO_LONGER_AVAILABLE, 'The peer is no longer available')
      }
    }
  })
})

function error (socket, code, msg) {
  console.log('Error ' + code + ': ' + msg)
  socket.close(code, msg)
}

module.exports = server
