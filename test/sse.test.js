import SigverError from '../src/error/SigverError'
import SSEError from '../src/error/SSEError'
import { xhtSend, randomKey } from './util.js'

const URL = 'http://localhost:8347'

describe('Server-Sent-Event: Open, Join and Transmit data each other', () => {
  let key = ''

  beforeEach(() => {
    key = randomKey()
  })

  it('Should succeed', done => {
    const esOpener = new EventSource(URL)
    let openerId = null
    esOpener.addEventListener('auth', evtMsg => {
      openerId = evtMsg.data
      xhtSend(URL, openerId, {open: key})
    })
    let esJoining = null
    let JoiningId = null
    const msgFromJoining = JSON.stringify({alice: 'Hello, it is me!'})
    const msgFromOpener = JSON.stringify({bob: 'Who me?'})

    esOpener.onerror = err => done.fail(err.message)
    esOpener.onmessage = msgEvent => {
      try {
        const msg = JSON.parse(msgEvent.data)
        const keysNb = Object.keys(msg).length
        if ('isKeyOk' in msg) {
          expect(msg.isKeyOk).toBeTruthy()
          expect(keysNb).toEqual(1)
          esJoining = new EventSource(URL)
          esJoining.addEventListener('auth', evtMsg => {
            JoiningId = evtMsg.data
            xhtSend(URL, JoiningId, {join: key})
          })
          esJoining.onerror = err => done.fail(err.message)
          esJoining.onmessage = msgEvent => {
            const msg = JSON.parse(msgEvent.data)
            const keysNb = Object.keys(msg).length
            if ('isKeyOk' in msg) {
              expect(msg.isKeyOk).toBeTruthy()
              expect(keysNb).toEqual(1)
              xhtSend(URL, JoiningId, {data: msgFromJoining, myId: msg.id})
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
          xhtSend(URL, openerId, {data: msgFromOpener, id: msg.id})
        }
      } catch (err) {
        console.log('Error: ' + msgEvent.data)
        done.fail(err.message)
      }
    }
  })

  it(`Should fail with code: ${SigverError.KEY_FOR_OPEN_EXISTS}`, done => {
    const es1 = new EventSource(URL)

    es1.addEventListener('auth', evtMsg => {
      xhtSend(URL, evtMsg.data, {open: key})
      const es2 = new EventSource(URL)
      es2.addEventListener('auth', evtMsg => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', URL, true)
        xhr.onload = function () {
          expect(this.status).toEqual(SSEError.code(SigverError.KEY_FOR_OPEN_EXISTS))
          done()
        }
        xhr.send(evtMsg.data + '@' + JSON.stringify({open: key}))
      })
      es2.onerror = err => {
        console.log('ERROR: ', err)
        done.fail(err.message)
      }
      es2.onmessage = msgEvent => {
        try {
          const msg = JSON.parse(msgEvent.data)
          expect('isKeyOk' in msg).toBeTruthy()
          expect(Object.keys(msg).length).toEqual(1)
          expect(msg.isKeyOk).toBeFalsy()
        } catch (err) {
          done.fail(err.message)
        }
      }
    })
    es1.onerror = err => done.fail(err.message)
  })

  it(`Should fail with code: ${SigverError.KEY_ERROR}`, done => {
    const key = 'Nullam et orci eu lorem consequat tincidunt vivamus et sagittis libero. Mauris aliquet magna magna sed nunc rhoncus pharetra. Pellentesque condimentum sem. In efficitur ligula tate urna. Maecenas laoreet massa vel lacinia pellentesque lorem ipsum dolor. Nullam et orci eu lorem consequat tincidunt. Vivamus et sagittis libero. Mauris aliquet magna magna sed nunc rhoncus amet feugiat tempus.Nullam et orci eu lorem consequat tincidunt vivamus et sagittis libero. Mauris aliquet magna magna sed nunc rhoncus pharetra. Pellentesque condimentum sem. In efficitur ligula tate urna. Maecenas laoreet massa vel lacinia pellentesque lorem ipsum dolor. Nullam et orci eu lorem consequat tincidunt. Vivamus et sagittis libero. Mauris aliquet magna magna sed nunc rhoncus amet feugiat tempus.'
    const es1 = new EventSource(URL)
    es1.addEventListener('auth', evtMsg => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', URL, true)
      xhr.onload = function () {
        expect(this.status).toEqual(SSEError.code(SigverError.KEY_ERROR))
        done()
      }
      xhr.send(evtMsg.data + '@' + JSON.stringify({open: key}))
    })
    es1.onmessage = msgEvent => {
      try {
        const msg = JSON.parse(msgEvent.data)
        expect('isKeyOk' in msg).toBeTruthy()
        expect(Object.keys(msg).length).toEqual(1)
        expect(msg.isKeyOk).toBeFalsy()
      } catch (err) {
        done.fail(err.message)
      }
    }
    es1.onerror = err => done.fail(err.message)
  })
})
