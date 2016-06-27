'use strict'

// Basic test which implies 2 clients who exchanges some datas and then close the connection
function runTest() { 
  var client2 = new WebSocket('ws://localhost:8000/111111')

  client2.onclose = (e) => {
    console.log('    8) CLIENT2: web socket closed')
  }

  client2.onopen = (e) => {
    let msgNb = 1
    client2.onmessage = (event) => {
      let msg = JSON.parse(event.data)
      if (msg.hasOwnProperty('data') && msg.hasOwnProperty('id')) {
        console.log('3 & 7) CLIENT2: data received')
        if (msgNb > 0) {
          msgNb--
          client2.send(JSON.stringify({id: msg.id, data: 'some data from client2'}))
          console.log('    4) CLIENT2: data sent')
        } else {
          client2.close()
        }
      }
    }

    client2.send(JSON.stringify({key: '111111'}))
    console.log('    1) CLIENT2: sent key')
  }

  var client1 = new WebSocket('ws://localhost:8000/111110')
  
  client1.onclose = (e) => {
    console.log('    9) CLIENT1: web socket closed')
  }

  client1.onopen = (e) => {
    client1.onmessage = (event) => {
      let msg = JSON.parse(event.data)
      if (msg.hasOwnProperty('data')) {
        console.log('    5) CLIENT1: data received')
        client1.send(JSON.stringify({data: 'some data from client1-2'}))
        console.log('    6) CLIENT1: data sent')
      }
    }

    client1.send(JSON.stringify({join: '111111', data: 'some data from client1-1'}))
    console.log('    2) CLIENT1: join with data sent')
  }
}
