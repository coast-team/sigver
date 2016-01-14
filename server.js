var WebSocketServer = require('ws').Server
var wss = new WebSocketServer({ port: 8080 }, function () {
  console.log('Server run on: ws://localhost:8080')
})

wss.on('connection', function connection (ws) {
  ws.on('message', function incoming (message) {
    var msg = JSON.parse(message)
    if (msg.hasOwnProperty('type')) {
      if (msg.type === 'icecandidate' || msg.type === 'offer') {
        if (msg.hasOwnProperty('index')) {
          ws.peers[msg.index].send(message)
        } else {
          ws.peer.send(message)
        }
        return
      } else if (msg.type === 'open') {
        return _open(ws, msg.id)
      } else if (msg.type === 'join') {
        return _join(ws, msg.id)
      }
    }
    ws.close()
  })
})

function _open (ws, id) {
  for (var i in wss.clients) {
    if (wss.clients[i].roomId === id) {
      ws.close()
    }
  }
  ws.roomId = id
  ws.peers = []
}

function _join (ws, id) {
  for (var i in wss.clients) {
    if (wss.clients[i].roomId === id) {
      ws.peer = wss.clients[i]
      wss.clients[i].peers.push(ws)
      wss.clients[i].send('{"type":"join"}')
      return
    }
  }
  ws.close()
}

module.exports = wss
