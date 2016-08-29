const WebSocketServer = require('ws').Server
const OPEN = require('ws').OPEN

const MAX_ID = 4294967295

// CloseEvent codes
const MESSAGE_TYPE_ERROR = 4000
const MESSAGE_UNKNOWN_ATTRIBUTE = 4001
const KEY_ALREADY_EXISTS = 4002
const KEY_UNKNOWN = 4003
const KEY_NO_LONGER_AVAILABLE = 4004

let server
const keyHolders = new Set()

function error (socket, code, msg) {
  console.log('Error ' + code + ': ' + msg)
  socket.close(code, msg)
}

function isKeyExist (key) {
  for (let h of keyHolders) if (h.key === key) return true
  return false
}

function getKeyHolder (key) {
  for (let h of keyHolders) if (h.key === key) return h
  return null
}

function generateId (peers) {
  let id
  do {
    id = Math.ceil(Math.random() * MAX_ID)
    if (peers.has(id)) continue
    break
  } while (true)
  return id
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
      try {
        if ('key' in msg) {
          if (isKeyExist(msg.key)) {
            socket.send('{"isKeyOk":false}')
            error(socket, KEY_ALREADY_EXISTS, 'The key already exists')
          } else {
            socket.send('{"isKeyOk":true}')
            socket.connectingPeers = new Map()
            socket.key = msg.key
            keyHolders.add(socket)
            socket.on('close', (event) => {
              keyHolders.delete(socket)
              socket.connectingPeers.forEach(s => {
                s.close(KEY_NO_LONGER_AVAILABLE, 'The peer with this key is no longer available')
              })
            })
          }
        } else if ('id' in msg && 'data' in msg) {
          socket.connectingPeers.get(msg.id).send(JSON.stringify({data: msg.data}))
        } else if ('join' in msg) {
          if (isKeyExist(msg.join)) {
            socket.send('{"isKeyOk":true}')
            socket.keyHolder = getKeyHolder(msg.join)
            let peers = socket.keyHolder.connectingPeers
            let id = generateId(peers)
            peers.set(id, socket)
            socket.on('close', (event) => {
              if (socket.keyHolder.readyState === OPEN) {
                socket.keyHolder.send(JSON.stringify({id, unavailable: true}))
              }
              peers.delete(id)
            })
            if ('data' in msg) {
              socket.keyHolder.send(JSON.stringify({id, data: msg.data}))
            }
          } else {
            socket.send('{"isKeyOk":false}')
            error(socket, KEY_UNKNOWN, 'Unknown key: ' + msg.join)
          }
        } else if ('data' in msg) {
          if ('keyHolder' in socket) {
            let id
            for (let [key, value] of socket.keyHolder.connectingPeers) {
              if (value === socket) {
                id = key
                break
              }
            }
            if (socket.keyHolder.readyState === OPEN) socket.keyHolder.send(JSON.stringify({id, data: msg.data}))
          } else {
            console.log('The client has not been assigned yet to a keyHolder')
          }
        } else {
          error(socket, MESSAGE_UNKNOWN_ATTRIBUTE, 'Unknown JSON attribute: ' + data)
        }
      } catch (err) {
        error(socket, err.code, err.message)
      }
    })

    socket.on('error', (event) => console.log('ERROR: ', event))
  })
}

function stop () {
  console.log('Server has stopped successfully')
  server.close()
}

export {start, stop}
