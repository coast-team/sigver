import SigverError from '../src/SigverError'
const URL = 'ws://localhost:8001'
// function isBrowser () {
//   if (typeof window === 'undefined' || (typeof process !== 'undefined' && process.title === 'node')) {
//     return false
//   }
//   return true
// }
//
// let WebSocket = null
// if (isBrowser()) {
//   WebSocket = window.WebSocket
// } else {
//   try {
//     WebSocket = require('uws')
//   } catch (err) {
//     console.error('Missing uws dependency')
//     process.exit(1)
//   }
// }
describe('Open, Join and Transmit data each other', () => {
  it('Should succeed', done => {
    const socketOpener = new WebSocket(URL)
    let socketJoining
    const msgFromJoining = 'Hello, it is me!'
    const msgFromOpener = 'Who me?'

    socketOpener.onerror = err => done.fail(err.message)
    socketOpener.onopen = () => {
      socketOpener.send(JSON.stringify({open: 'testKEY'}))
    }

    socketOpener.onmessage = msgEvent => {
      try {
        const msg = JSON.parse(msgEvent.data)
        const keysNb = Object.keys(msg).length
        if ('isKeyOk' in msg) {
          expect(msg).toEqual({isKeyOk: true})
          socketJoining = new WebSocket(URL)
          socketJoining.onerror = err => done.fail(err.message)
          socketJoining.onopen = () => {
            socketJoining.send(JSON.stringify({join: 'testKEY'}))
          }
          socketJoining.onmessage = msgEvent => {
            const msg = JSON.parse(msgEvent.data)
            const keysNb = Object.keys(msg).length
            if ('isKeyOk' in msg) {
              expect(msg).toEqual({isKeyOk: true})
              socketJoining.send(JSON.stringify({data: msgFromJoining}))
            } else {
              // Received a message from Opener transmitted by sigver
              expect('data' in msg).toBeTruthy()
              expect(keysNb).toEqual(1)
              expect(typeof msg.data).toEqual('string')
              expect(msg.data).toEqual(msgFromOpener)
              done()
            }
          }
        } else {
          // Received a message from Joining transmitted by sigver
          expect('id' in msg && 'data' in msg).toBeTruthy()
          expect(keysNb).toEqual(2)
          expect(msg.id).toEqual(jasmine.any(Number))
          expect(typeof msg.data).toEqual('string')
          expect(msg.data).toEqual(msgFromJoining)
          socketOpener.send(JSON.stringify({id: msg.id, data: msgFromOpener}))
        }
      } catch (err) {
        console.log('Error: ' + msgEvent.data)
        done.fail(err.message)
      }
    }
  })

  it(`Should fail with code: ${SigverError.KEY_FOR_OPEN_EXISTS}`, done => {
    const socket1 = new WebSocket(URL)
    const socket2 = new WebSocket(URL)

    socket1.onerror = err => done.fail(err.message)
    socket1.onopen = () => socket1.send(JSON.stringify({open: 'testKEY'}))

    socket2.onclose = (closeEvent) => {
      expect(closeEvent.code).toEqual(SigverError.KEY_FOR_OPEN_EXISTS[1])
      setTimeout(() => {
        expect(socket1.readyState === WebSocket.OPEN)
        socket1.close()
        done()
      }, 100)
    }
    socket2.onerror = err => done.fail(err.message)
    socket2.onopen = () => socket2.send(JSON.stringify({open: 'testKEY'}))

    socket2.onmessage = msgEvent => {
      try {
        const msg = JSON.parse(msgEvent.data)
        expect(msg).toEqual({isKeyOk: false})
      } catch (err) {
        socket1.close()
        done.fail(err.message)
      }
    }
  })

  it(`Should fail with code: ${SigverError.KEY_TOO_LONG}`, done => {
    const socket = new WebSocket(URL)
    const key = 'Nullam et orci eu lorem consequat tincidunt vivamus et sagittis libero. Mauris aliquet magna magna sed nunc rhoncus pharetra. Pellentesque condimentum sem. In efficitur ligula tate urna. Maecenas laoreet massa vel lacinia pellentesque lorem ipsum dolor. Nullam et orci eu lorem consequat tincidunt. Vivamus et sagittis libero. Mauris aliquet magna magna sed nunc rhoncus amet feugiat tempus.Nullam et orci eu lorem consequat tincidunt vivamus et sagittis libero. Mauris aliquet magna magna sed nunc rhoncus pharetra. Pellentesque condimentum sem. In efficitur ligula tate urna. Maecenas laoreet massa vel lacinia pellentesque lorem ipsum dolor. Nullam et orci eu lorem consequat tincidunt. Vivamus et sagittis libero. Mauris aliquet magna magna sed nunc rhoncus amet feugiat tempus.'

    socket.onclose = (closeEvent) => {
      expect(closeEvent.code).toEqual(SigverError.KEY_TOO_LONG[1])
      done()
    }
    socket.onerror = err => done.fail(err.reason)
    socket.onopen = () => socket.send(JSON.stringify({open: key}))
  })
})
