import * as h from './util.js'

const ERR_KEY = 4741
const ERR_HEARTBEAT = 4742
const ERR_MESSAGE = 4743
const ERR_BLOCKING_MEMBER = 4744
const URL = 'ws://localhost:8010'

describe('Signaling WebSocket server test', () => {
  // const channels = new Set()

  // function getConnection(key) {
  //   const ws = new WebSocket(`${URL}/${key}`)
  //   ws.binaryType = 'arraybuffer'
  //   ws.onclose = (closeEvt) => fail(closeEvt.reason)
  //   ws.onerror = (err) => fail(err.message)
  //   ws.onopen = () => channels.add(ws)
  //   return {
  //     set onmessage(cb) {
  //       ws.onmessage = (msgEvt) => {
  //         const msg = h.decode(msgEvt.data)
  //         if (msg.type === 'heartbeat') {
  //           ws.send(h.encode({ pong: true }))
  //         } else {
  //           cb(msg)
  //         }
  //       }
  //     },
  //     send: (msg) => ws.send(h.encode(msg)),
  //   }
  // }

  // afterEach(() => {
  //   for (let ws of channels) {
  //     ws.onclose = undefined
  //     ws.close(1000)
  //   }
  //   channels.clear()
  // })

  it('Should connect to the server', (done) => {
    const ws = new WebSocket(`${URL}/${h.randomKey()}`)
    ws.onopen = () => done()
  })

  describe('Should fail to connect', () => {
    it(`with code: ${ERR_KEY} because the key is too long`, (done) => {
      const key =
        'Nullam et orci eu lorem consequat tincidunt vivamus et sagittis libero. Mauris aliquet magna magna sed nunc rhoncus pharetra. Pellentesque condimentum sem. In efficitur ligula tate urna. Maecenas laoreet massa vel lacinia pellentesque lorem ipsum dolor. Nullam et orci eu lorem consequat tincidunt. Vivamus et sagittis libero. Mauris aliquet magna magna sed nunc rhoncus amet feugiat tempus.Nullam et orci eu lorem consequat tincidunt vivamus et sagittis libero. Mauris aliquet magna magna sed nunc rhoncus pharetra. Pellentesque condimentum sem. In efficitur ligula tate urna. Maecenas laoreet massa vel lacinia pellentesque lorem ipsum dolor. Nullam et orci eu lorem consequat tincidunt. Vivamus et sagittis libero. Mauris aliquet magna magna sed nunc rhoncus amet feugiat tempus.'
      const ws = new WebSocket(`${URL}/${key}`)
      ws.onclose = ({ code }) => {
        expect(code).toEqual(ERR_KEY)
        done()
      }
    })

    it(`with code: ${ERR_KEY} because the key is empty`, (done) => {
      const ws = new WebSocket(URL)
      ws.onclose = ({ code }) => {
        expect(code).toEqual(ERR_KEY)
        done()
      }
    })

    it(`with code: ${ERR_MESSAGE} because the message is unknown`, (done) => {
      const ws = new WebSocket(`${URL}/azerty`)
      ws.onopen = () => ws.send('hello my friend')
      ws.onclose = ({ code }) => {
        expect(code).toEqual(ERR_MESSAGE)
        done()
      }
    })

    it(
      `with code: ${ERR_HEARTBEAT} because did not send hearbeat message`,
      (done) => {
        let heartbeats = 0
        const ws = new WebSocket(`${URL}/${h.randomKey()}`)
        ws.binaryType = 'arraybuffer'
        ws.onmessage = ({ data }) => {
          heartbeats++
          const msg = h.decode(data)
          expect(msg.type).toEqual('heartbeat')
        }
        ws.onclose = ({ code }) => {
          expect(heartbeats).toEqual(2)
          expect(code).toEqual(ERR_HEARTBEAT)
          done()
        }
      },
      20000
    )
  })

  // it('Should be the first in the network', (done) => {
  //   const con = getConnection(h.randomKey())
  //   con.onmessage = (msg) => {
  //     expect(msg.isFirst).toBeTruthy()
  //     done()
  //   }
  // })

  // it('Should NOT be the first in the network', (done) => {
  //   const key = h.randomKey()
  //   const con1 = getConnection(key)
  //   con1.onmessage = (msg) => {
  //     expect(msg.isFirst).toBeTruthy()
  //     const con2 = getConnection(key)
  //     con2.onmessage = (msg) => {
  //       expect(msg.isFirst).toBeFalsy()
  //       done()
  //     }
  //   }
  // })

  // it('Should transmit data between a network member and a joining peer', (done) => {
  //   const key = h.randomKey()
  //   const msg1 = h.randomBytes()
  //   const msg2 = h.randomBytes()
  //   const con1 = getConnection(key)
  //   const msgSeq = (function*() {
  //     let msg = yield
  //     expect(msg.isFirst).toBeTruthy()
  //     const con2 = getConnection(key)
  //     con2.onmessage = (msg) => msgSeq.next(msg)

  //     msg = yield
  //     expect(msg.isFirst).toBeFalsy()
  //     con2.send({ content: { data: msg2 } })

  //     msg = yield
  //     expect(msg.content.id).not.toEqual(1)
  //     expect(msg.content.data).toEqual(msg2)
  //     con1.send({ content: { id: msg.content.id, data: msg1 } })

  //     msg = yield
  //     expect(msg.content.id).toEqual(1)
  //     expect(msg.content.data).toEqual(msg1)
  //     done()
  //   })()
  //   msgSeq.next()
  //   con1.onmessage = (msg) => msgSeq.next(msg)
  // })

  // it('Should transmit data between a network member and 2 joining peers', (done) => {
  //   const key = h.randomKey()
  //   const msg12 = h.randomBytes()
  //   const msg13 = h.randomBytes()
  //   const msg2 = h.randomBytes()
  //   const msg3 = h.randomBytes()

  //   const con1 = getConnection(key)
  //   const msgSeq = (function*() {
  //     let msg = yield
  //     expect(msg.isFirst).toBeTruthy()
  //     const con2 = getConnection(key)
  //     con2.onmessage = (msg) => msgSeq.next(msg)

  //     msg = yield
  //     expect(msg.isFirst).toBeFalsy()
  //     const con3 = getConnection(key)
  //     con3.onmessage = (msg) => msgSeq.next(msg)

  //     msg = yield
  //     expect(msg.isFirst).toBeFalsy()
  //     con2.send({ content: { data: msg2 } })

  //     msg = yield
  //     expect(msg.content.id).not.toEqual(1)
  //     expect(msg.content.data).toEqual(msg2)
  //     con1.send({ content: { id: msg.content.id, data: msg12 } })

  //     msg = yield
  //     expect(msg.content.id).toEqual(1)
  //     expect(msg.content.data).toEqual(msg12)
  //     con3.send({ content: { data: msg3 } })

  //     msg = yield
  //     expect(msg.content.id).not.toEqual(1)
  //     expect(msg.content.data).toEqual(msg3)
  //     con1.send({ content: { id: msg.content.id, data: msg13 } })

  //     msg = yield
  //     expect(msg.content.id).toEqual(1)
  //     expect(msg.content.data).toEqual(msg13)
  //     done()
  //   })()
  //   msgSeq.next()
  //   con1.onmessage = (msg) => msgSeq.next(msg)
  // })
})
