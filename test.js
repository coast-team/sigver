'use strict'

let wss = require('./server')
let WebSocket = require('ws')

let wsTrigger, wsJoining
wsTrigger = new WebSocket('ws://localhost:' + wss.options.port)

wsTrigger.on('close', function open () {
  console.log('TRIGGER: web socket has been closed')
})
wsTrigger.on('open', function open () {
  wsTrigger.on('message', function open (data, flags) {
    var msg = JSON.parse(data)
    if (msg.type === 'join') {
      console.log('TRIGGER: join received')
      wsTrigger.send(JSON.stringify({type: 'offer', index: 0, data: 'my offer'}), function () {
        console.log('TRIGGER: offer sent')
      })
    } else if (msg.type === 'offer') {
      console.log('TRIGGER: offer received')
      wsTrigger.send(JSON.stringify({type: 'icecandidate', index: 0, data: 'my icecandidate'}), function () {
        console.log('TRIGGER: icecandidate sent')
      })
    } else if (msg.type === 'icecandidate') {
      console.log('TRIGGER: icecandidate received')
      wss.close()
    }
  })
  wsTrigger.send(JSON.stringify({type: 'open', key: '11111'}), function () {
    console.log('TRIGGER: open sent')
    wsJoining = new WebSocket('ws://localhost:' + wss.options.port + '/111111')
    wsJoining.on('close', function open () {
      console.log('JOINING: web socket has been closed')
    })
    wsJoining.on('open', function open () {
      wsJoining.on('message', function open (data, flags) {
        var msg = JSON.parse(data)
        if (msg.type === 'offer') {
          console.log('JOINING: offer received')
          wsJoining.send(JSON.stringify({type: 'offer', data: 'and here is my offer'}), function () {
            console.log('JOINING: offer sent')
          })
        } else if (msg.type === 'icecandidate') {
          console.log('JOINING: icecandidate received')
          wsJoining.send(JSON.stringify({type: 'icecandidate', data: 'and here is my icecandidate'}), function () {
            console.log('JOINING: icecandidate sent')
          })
        }
      })
      wsJoining.send(JSON.stringify({type: 'join', key: '11111'}), function () {
        console.log('JOINING: join sent')
      })
    })
  })
})
