'use strict';

// Basic test which implies 2 clients who exchanges some datas and then close the connection
function runTest() { 
  var client2 = new WebSocket('ws://localhost:8000/111111')

  client2.onclose = function(event) {
    console.log('    8) CLIENT2: web socket closed')
  }

  client2.onopen = function(event) {
    let msgNb = 1
    client2.onmessage = function(event) {
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
  
  client1.onclose = function(event) {
    console.log('    9) CLIENT1: web socket closed')
  }

  client1.onopen = function(event) {
    client1.onmessage = function(event) {
      let msg = JSON.parse(event.data)
      if (msg.hasOwnProperty('data')) {
        console.log('    5) CLIENT1: data received')
        client1.send(JSON.stringify({data: 'some data from client1-2'}))
        console.log('    6) CLIENT1: data sent')
      }

      // client1.close()
    }

    client1.send(JSON.stringify({join: '111111', data: 'some data from client1-1'}))
    console.log('    2) CLIENT1: join with data sent')
  }
}



  /*let connectedSockets = []

  sigVer.wsServer.addEventListener('request', (req) => {
    let socket = req.accept()
    connectedSockets.push(socket)








    let msgNb = 1

    socket.addEventListener('message', (data, flags) => {
      let msg = JSON.parse(data)
      if (msg.hasOwnProperty('id') && msg.hasOwnProperty('data')) {
        console.log('3 & 7) MASTER: data received')
        if (msgNb > 0) {
          msgNb--
          socket.send(JSON.stringify({id: msg.id, data: 'some data from master'}), () => {
            console.log('    4) MASTER: data sent')
          })
        } else {
          socket.close()
        }
      }
    })

    socket.send(JSON.stringify({key: '11111'}), () => {
      console.log('    1) MASTER: key sent')

      let client = new WebSocket('ws://localhost:' + PORT + '/11111')

      client.onclose = () => {
        console.log('    9) CLIENT: web socket closed')
      }

      client.onopen = () => {
        client.onmessage = (data, flags) => {
          let msg = JSON.parse(data)

          if (msg.hasOwnProperty('data')) {
            console.log('    5) CLIENT: data received')
            client.send(JSON.stringify({data: 'some data from client'}), () => {
              console.log('    6) CLIENT: data sent')
            })
          }
        }

        client.send(JSON.stringify({join: '11111', data: 'some data from client'}), () => {
          console.log('    2) CLIENT: join with data sent')
        })
      }
    })
  })*/

  /*sigVer.server.send(JSON.stringify({key: '11111'}), () => {
    console.log('    1) MASTER: key sent')
  })*/

  /*console.log("fin")
  return 1*/
  //return sigVer
//}

  /*master.on('close', () => {
    console.log('    8) MASTER: web socket closed');
  });*/
  /*master.on('open', () => {
    /*let msgNb = 1;
    master.on('message', (data, flags) => {
      let msg = JSON.parse(data);
      if (msg.hasOwnProperty('id') && msg.hasOwnProperty('data')) {
        console.log('3 & 7) MASTER: data received');
        if (msgNb > 0) {
          msgNb--;
          master.send(JSON.stringify({id: msg.id, data: 'some data from master'}), () => {
            console.log('    4) MASTER: data sent');
          });
        } else {
          master.close();
          // wss.close();
        }
      }
    });*/
    /*master.send(JSON.stringify({key: '11111'}), () => {
      /*console.log('    1) MASTER: key sent');
      let client = new WebSocket('ws://localhost:' + PORT + '/111111');
      client.on('close', () => {
        console.log('    9) CLIENT: web socket closed');
      });*/
      /*client.on('open', () => {
        /*client.on('message', (data, flags) => {
          let msg = JSON.parse(data);
          if (msg.hasOwnProperty('data')) {
            console.log('    5) CLIENT: data received');
            client.send(JSON.stringify({data: 'some data from client'}), () => {
              console.log('    6) CLIENT: data sent');
            });
          }
        });*/
        /*client.send(JSON.stringify({join: '11111', data: 'some data from client'}), () => {
          console.log('    2) CLIENT: join with data sent');
        });
      });
    });
  });
}*/