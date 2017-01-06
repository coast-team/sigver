import SigverError from '../src/SigverError'

const URL = 'http://localhost:8002'

describe('Server-Sent-Event Server: Open, Join and Transmit data each other', () => {
  it('Should succeed', done => {
    const esOpener = new EventSource(`${URL}/?open=123456`)
    let openerId = null
    let esJoining
    const msgFromJoining = JSON.stringify({alice: 'Hello, it is me!'})
    const msgFromOpener = JSON.stringify({bob: 'Who me?'})

    esOpener.onerror = err => done.fail(err.message)
    esOpener.onmessage = msgEvent => {
      try {
        const msg = JSON.parse(msgEvent.data)
        const keysNb = Object.keys(msg).length
        if ('isKeyOk' in msg) {
          expect(msg.isKeyOk).toBeTruthy()
          expect(keysNb).toEqual(2)
          expect('id' in msg).toBeTruthy()
          openerId = msg.id
          esJoining = new EventSource(`${URL}/?join=123456`)
          esJoining.onerror = err => done.fail(err.message)
          esJoining.onmessage = msgEvent => {
            const msg = JSON.parse(msgEvent.data)
            const keysNb = Object.keys(msg).length
            if ('isKeyOk' in msg) {
              expect(msg.isKeyOk).toBeTruthy()
              expect(keysNb).toEqual(2)
              expect('id' in msg).toBeTruthy()
              $.get({
                url: URL,
                crossDomain: true,
                data: {
                  data: msgFromJoining,
                  myId: msg.id
                }
              })
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
          $.get({
            url: URL,
            crossDomain: true,
            data: {
              data: msgFromOpener,
              id: msg.id,
              myId: openerId
            }
          })
        }
      } catch (err) {
        console.log('Error: ' + msgEvent.data)
        done.fail(err.message)
      }
    }
  })

  it(`Should fail with code: ${SigverError.KEY_FOR_OPEN_EXISTS}`, done => {
    const es1 = new EventSource(`${URL}/?open=123456`)
    es1.onopen = () => {
      const es2 = new EventSource(`${URL}/?open=123456`)
      es2.onerror = err => done.fail(err.message)
      es2.onmessage = msgEvent => {
        try {
          const msg = JSON.parse(msgEvent.data)
          expect('isKeyOk' in msg).toBeTruthy()
          expect('error' in msg).toBeTruthy()
          expect('message' in msg).toBeTruthy()
          expect(Object.keys(msg).length).toEqual(3)
          expect(msg.isKeyOk).toBeFalsy()
          expect(msg.error).toEqual(SigverError.KEY_FOR_OPEN_EXISTS[1])
          es2.close()
          done()
        } catch (err) {
          es1.close()
          done.fail(err.message)
        }
      }
    }
    es1.onerror = err => done.fail(err.message)
  })

  it(`Should fail with code: ${SigverError.KEY_ERROR}`, done => {
    const key = 'Nullam et orci eu lorem consequat tincidunt vivamus et sagittis libero. Mauris aliquet magna magna sed nunc rhoncus pharetra. Pellentesque condimentum sem. In efficitur ligula tate urna. Maecenas laoreet massa vel lacinia pellentesque lorem ipsum dolor. Nullam et orci eu lorem consequat tincidunt. Vivamus et sagittis libero. Mauris aliquet magna magna sed nunc rhoncus amet feugiat tempus.Nullam et orci eu lorem consequat tincidunt vivamus et sagittis libero. Mauris aliquet magna magna sed nunc rhoncus pharetra. Pellentesque condimentum sem. In efficitur ligula tate urna. Maecenas laoreet massa vel lacinia pellentesque lorem ipsum dolor. Nullam et orci eu lorem consequat tincidunt. Vivamus et sagittis libero. Mauris aliquet magna magna sed nunc rhoncus amet feugiat tempus.'
    const es1 = new EventSource(`${URL}/?open=${key}`)
    es1.onmessage = msgEvent => {
      try {
        const msg = JSON.parse(msgEvent.data)
        expect('isKeyOk' in msg).toBeTruthy()
        expect('error' in msg).toBeTruthy()
        expect('message' in msg).toBeTruthy()
        expect(Object.keys(msg).length).toEqual(3)
        expect(msg.isKeyOk).toBeFalsy()
        expect(msg.error).toEqual(SigverError.KEY_ERROR[1])
        done()
      } catch (err) {
        done.fail(err.message)
      }
    }
    es1.onerror = err => done.fail(err.message)
  })
})
