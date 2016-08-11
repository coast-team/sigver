const WebSocketServer = require('ws').Server
const OPEN = require('ws').OPEN

// CloseEvent codes
const MESSAGE_TYPE_ERROR = 4000
const MESSAGE_UNKNOWN_ATTRIBUTE = 4001
const KEY_ALREADY_EXISTS = 4002
const KEY_UNKNOWN = 4003
const KEY_NO_LONGER_AVAILABLE = 4004

let server
const keys = new Map()

function error (socket, code, msg) {
  console.log('Error ' + code + ': ' + msg)
  socket.close(code, msg)
}

function start (host, port, onStart = () => {}) {
  server = new WebSocketServer({host, port}, () => {
    console.log(`Server runs on: ${host}:${port}`)
    onStart()
  })

  server.on('connection', (socket) => {
    socket.on('message', (data) => {
      let msg
      try {
        msg = JSON.parse(data)
      } catch (event) {
        error(socket, MESSAGE_TYPE_ERROR, 'Server accepts only JSON string')
      }
      if ('key' in msg) {
        if (keys.has(msg.key)) {
          socket.send('{"isKeyOk":"false"}')
          error(socket, KEY_ALREADY_EXISTS, 'The key already exists')
        } else {
          socket.send('{"isKeyOk":"true"}')
          socket.joiningSockets = []
          keys.set(msg.key, socket)
        }
      } else if ('id' in msg) {
        socket.joiningSockets[+msg.id].send(JSON.stringify({data: msg.data}))
      } else if ('join' in msg) {
        if (keys.has(msg.join)) {
          socket.keyHolder = keys.get(msg.join)
          let id = socket.keyHolder.joiningSockets.length
          socket.keyHolder.joiningSockets[id] = socket
          console.log('length after ADD: ' + socket.keyHolder.joiningSockets.length)
          socket.send('{"isJoinOk":"true"}')
          if ('data' in msg) {
            socket.keyHolder.send(JSON.stringify({id, data: msg.data}))
          }
        } else {
          socket.send('{"isJoinOk":"false"}')
          error(socket, KEY_UNKNOWN, 'Unknown key')
        }
      } else if ('data' in msg) {
        let id = socket.keyHolder.joiningSockets.indexOf(socket)
        if ('keyHolder' in socket) {
          socket.keyHolder.send(JSON.stringify({id, data: msg.data}))
        } else {
          console.log(`The client ${id} has not been assigned yet to a keyHolder`)
        }
      } else {
        error(socket, MESSAGE_UNKNOWN_ATTRIBUTE, 'Unknown JSON attribute: ' + data)
      }
    })

    socket.on('close', (event) => {
      if ('keyHolder' in socket) {
        let id = socket.keyHolder.joiningSockets.indexOf(socket)
        if (socket.keyHolder.readyState === OPEN) {
          socket.keyHolder.send(JSON.stringify({id, unavailable: true}))
        }
        socket.keyHolder.joiningSockets.splice(id, 1)
        console.log('length after REMOVE: ' + socket.keyHolder.joiningSockets.length)
      } else {
        for (let s of socket.joiningSockets) {
          s.close(KEY_NO_LONGER_AVAILABLE, 'The peer with this key is no longer available')
        }
      }
    })

    socket.on('error', (event) => {
      console.log('ERROR: ', event)
    })
  })
}

function stop () {
  console.log('Server has stopped successfully')
  server.close()
}

export {start, stop}
