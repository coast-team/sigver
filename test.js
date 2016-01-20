'use strict'

let wss = require('./server')
let WebSocket = require('ws')

let wsTrigger, wsJoining
wsTrigger = new WebSocket('ws://localhost:' + wss.options.port)

wsTrigger.on('close', () => {
  console.log('TRIGGER: web socket has been closed')
})
wsTrigger.on('open', () => {
  wsTrigger.on('message', (data, flags) => {
    let msg = JSON.parse(data)
    if (msg.type === 'join') {
      console.log('TRIGGER: join received')
      wsTrigger.send(JSON.stringify({index: 0, offer: 'my offer'}), () => {
        console.log('TRIGGER: offer sent')
      })
    } else if (msg.hasOwnProperty('offer')) {
      console.log('TRIGGER: offer received')
      wsTrigger.send(JSON.stringify({index: 0, candidate: 'my icecandidate'}), () => {
        console.log('TRIGGER: icecandidate sent')
      })
    } else if (msg.hasOwnProperty('candidate')) {
      console.log('TRIGGER: icecandidate received')
      wss.close()
    }
  })
  wsTrigger.send(JSON.stringify({type: 'open', key: '11111'}), () => {
    console.log('TRIGGER: open sent')
    wsJoining = new WebSocket('ws://localhost:' + wss.options.port + '/111111')
    wsJoining.on('close', () => {
      console.log('JOINING: web socket has been closed')
    })
    wsJoining.on('open', () => {
      wsJoining.on('message', (data, flags) => {
        let msg = JSON.parse(data)
        if (msg.hasOwnProperty('offer')) {
          console.log('JOINING: offer received')
          wsJoining.send(JSON.stringify({offer: 'and here is my offer'}), () => {
            console.log('JOINING: offer sent')
          })
        } else if (msg.hasOwnProperty('candidate')) {
          console.log('JOINING: icecandidate received')
          wsJoining.send(JSON.stringify({candidate: 'and here is my icecandidate'}), () => {
            console.log('JOINING: icecandidate sent')
          })
        }
      })
      wsJoining.send(JSON.stringify({type: 'join', key: '11111'}), () => {
        console.log('JOINING: join sent')
      })
    })
  })
})
