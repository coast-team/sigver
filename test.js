'use strict'

let wss = require('./server')
let WebSocket = require('ws')

let wsTrigger, wsJoining
wsTrigger = new WebSocket('ws://localhost:' + wss.options.port)

wsTrigger.on('close', () => {
  console.log('TRIGGER: web socket closed')
})
wsTrigger.on('open', () => {
  wsTrigger.on('message', (message, flags) => {
    let msg = JSON.parse(message)
    if (msg.hasOwnProperty('offer')) {
      console.log('TRIGGER: offer received')
      wsTrigger.send(JSON.stringify({answer: 'SDP answer'}), () => {
        console.log('TRIGGER: answer sent')
      })
    }
  })
  wsTrigger.send(JSON.stringify({key: '11111'}), () => {
    console.log('TRIGGER: key sent')

    wsJoining = new WebSocket('ws://localhost:' + wss.options.port + '/111111')
    wsJoining.on('close', () => {
      console.log('JOINING: web socket closed')
    })
    wsJoining.on('open', () => {
      wsJoining.on('message', (data, flags) => {
        let msg = JSON.parse(data)
        if (msg.hasOwnProperty('reachable')) {
          console.log('JOINING: key exists')
          wsJoining.send(JSON.stringify({offer: 'SDP offer'}), () => {
            console.log('JOINING: offer sent')
          })
        } else if (msg.hasOwnProperty('answer')) {
          console.log('JOINING: answer received')
          wss.close()
        }
      })
      wsJoining.send(JSON.stringify({joinkey: '11111'}), () => {
        console.log('JOINING: join sent')
      })
    })
  })
})
