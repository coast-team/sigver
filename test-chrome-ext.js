'use strict';

const PORT = 8000;

// let wss = require('./server')
let WebSocket = require('ws');

let master = new WebSocket('ws://localhost:' + PORT);

master.on('close', () => {
  console.log('    8) MASTER: web socket closed');
});
master.on('open', () => {
  let msgNb = 1;
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
  });
  master.send(JSON.stringify({key: '11111'}), () => {
    console.log('    1) MASTER: key sent');
    let client = new WebSocket('ws://localhost:' + PORT + '/111111');
    client.on('close', () => {
      console.log('    9) CLIENT: web socket closed');
    });
    client.on('open', () => {
      client.on('message', (data, flags) => {
        let msg = JSON.parse(data);
        if (msg.hasOwnProperty('data')) {
          console.log('    5) CLIENT: data received');
          client.send(JSON.stringify({data: 'some data from client'}), () => {
            console.log('    6) CLIENT: data sent');
          });
        }
      });
      client.send(JSON.stringify({join: '11111', data: 'some data from client'}), () => {
        console.log('    2) CLIENT: join with data sent');
      });
    });
  });
});
