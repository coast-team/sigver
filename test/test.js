import SigverError from '../src/SigverError'
import * as h from './util.js'

describe('', () => {
  test(WebSocket)
  // test(RichEventSource)
})

function test (Source) {
  let url = null
  if (Source.name === 'WebSocket') {
    url = 'ws://localhost:8034'
  } else if (Source.name === 'RichEventSource') {
    url = 'http://localhost:8347'
  }

  describe(Source.name, () => {
    const channels = new Set()

    function getConnection (key, fail) {
      const ws = new Source(`${url}/${key}`)
      ws.binaryType = 'arraybuffer'
      ws.onclose = closeEvt => fail(closeEvt.reason)
      ws.onerror = err => fail(err.message)
      ws.onopen = () => channels.add(ws)
      return { /* eslint accessor-pairs: "off" */
        set onmessage (cb) {
          ws.onmessage = msgEvt => {
            const msg = h.decode(msgEvt.data)
            if (msg.type === 'ping') {
              ws.send(h.encode({ pong: true }))
            } else {
              cb(msg)
            }
          }
        },
        send: msg => ws.send(h.encode(msg))
      }
    }

    afterEach(() => {
      for (let ws of channels) {
        ws.onclose = () => {}
        ws.close(1000)
      }
      channels.clear()
    })

    it('Should be the first in the network', done => {
      const con = getConnection(h.randomKey(), done.fail)
      con.onmessage = msg => {
        expect(msg.isFirst).toBeTruthy()
        done()
      }
    })

    it('Should NOT be the first in the network', done => {
      const key = h.randomKey()
      const con1 = getConnection(key, done.fail)
      con1.onmessage = msg => {
        expect(msg.isFirst).toBeTruthy()
        const con2 = getConnection(key, done.fail)
        con2.onmessage = msg => {
          expect(msg.isFirst).toBeFalsy()
          done()
        }
      }
    })

    it('Should transmit data between a network member and a joining peer', done => {
      const key = h.randomKey()
      const msg1 = h.randomBytes()
      const msg2 = h.randomBytes()
      const con1 = getConnection(key, done.fail)
      const msgSeq = (function * () {
        let msg = yield
        expect(msg.isFirst).toBeTruthy()
        const con2 = getConnection(key, done.fail)
        con2.onmessage = msg => msgSeq.next(msg)

        msg = yield
        expect(msg.isFirst).toBeFalsy()
        con2.send({ content: { data: msg2 } })

        msg = yield
        expect(msg.content.id).not.toEqual(0)
        expect(msg.content.data).toEqual(msg2)
        con1.send({ content: { id: msg.content.id, data: msg1 } })

        msg = yield
        expect(msg.content.id).toEqual(0)
        expect(msg.content.data).toEqual(msg1)
        done()
      })()
      msgSeq.next()
      con1.onmessage = msg => msgSeq.next(msg)
    })

    it('Should transmit data between a network member and 2 joining peers', done => {
      const key = h.randomKey()
      const msg12 = h.randomBytes()
      const msg13 = h.randomBytes()
      const msg2 = h.randomBytes()
      const msg3 = h.randomBytes()

      const con1 = getConnection(key, done.fail)
      const msgSeq = (function * () {
        let msg = yield
        expect(msg.isFirst).toBeTruthy()
        const con2 = getConnection(key, done.fail)
        con2.onmessage = msg => msgSeq.next(msg)

        msg = yield
        expect(msg.isFirst).toBeFalsy()
        const con3 = getConnection(key, done.fail)
        con3.onmessage = msg => msgSeq.next(msg)

        msg = yield
        expect(msg.isFirst).toBeFalsy()
        con2.send({ content: { data: msg2 } })

        msg = yield
        expect(msg.content.id).not.toEqual(0)
        expect(msg.content.data).toEqual(msg2)
        con1.send({ content: { id: msg.content.id, data: msg12 } })

        msg = yield
        expect(msg.content.id).toEqual(0)
        expect(msg.content.data).toEqual(msg12)
        con3.send({ content: { data: msg3 } })

        msg = yield
        expect(msg.content.id).not.toEqual(0)
        expect(msg.content.data).toEqual(msg3)
        con1.send({ content: { id: msg.content.id, data: msg13 } })

        msg = yield
        expect(msg.content.id).toEqual(0)
        expect(msg.content.data).toEqual(msg13)
        done()
      })()
      msgSeq.next()
      con1.onmessage = msg => msgSeq.next(msg)
    })

    describe('Should fail to connect', () => {
      it(`with code: ${SigverError.KEY_ERROR} because the key is too long`, done => {
        const key = 'Nullam et orci eu lorem consequat tincidunt vivamus et sagittis libero. Mauris aliquet magna magna sed nunc rhoncus pharetra. Pellentesque condimentum sem. In efficitur ligula tate urna. Maecenas laoreet massa vel lacinia pellentesque lorem ipsum dolor. Nullam et orci eu lorem consequat tincidunt. Vivamus et sagittis libero. Mauris aliquet magna magna sed nunc rhoncus amet feugiat tempus.Nullam et orci eu lorem consequat tincidunt vivamus et sagittis libero. Mauris aliquet magna magna sed nunc rhoncus pharetra. Pellentesque condimentum sem. In efficitur ligula tate urna. Maecenas laoreet massa vel lacinia pellentesque lorem ipsum dolor. Nullam et orci eu lorem consequat tincidunt. Vivamus et sagittis libero. Mauris aliquet magna magna sed nunc rhoncus amet feugiat tempus.'
        const ws = new Source(`${url}/${key}`)
        ws.onclose = closeEvt => {
          expect(closeEvt.code).toEqual(SigverError.KEY_ERROR)
          done()
        }
        ws.onerror = err => done.fail(err.message)
      })

      it(`with code: ${SigverError.KEY_ERROR} because the key is empty`, done => {
        const ws = new Source(`${url}`)
        ws.onclose = closeEvt => {
          expect(closeEvt.code).toEqual(SigverError.KEY_ERROR)
          done()
        }
        ws.onerror = err => done.fail(err.message)
      })
    })
  })
}
