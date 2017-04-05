import SigverError from '../src/SigverError'
import { randomKey } from './util.js'

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

    function wsReady (fail) {
      return new Promise((resolve, reject) => {
        const ws = new Source(url)
        ws.onopen = () => {
          channels.add(ws)
          resolve(ws)
        }
        ws.onerror = err => fail(err.message)
        ws.onclose = closeEvt => fail(closeEvt.reason)
      })
    }

    beforeEach(() => {
      channels.clear()
    })

    afterEach(() => {
      for (let ws of channels) {
        ws.onclose = () => {}
        ws.close(1000)
      }
    })

    it('Should send join', done => {
      wsReady(done.fail).then(ws => {
        ws.onmessage = msgEvt => {
          const msg = JSON.parse(msgEvt.data)
          expect('first' in msg || 'ping' in msg).toBeTruthy()
          if ('first' in msg) {
            expect(msg.first).toBeTruthy()
            done()
          } else if ('ping' in msg) {
            ws.send(JSON.stringify({pong: true}))
          } else {
            done.fail(msg)
          }
        }
        ws.send(JSON.stringify({join: randomKey()}))
      })
    })

    it('Should send open', done => {
      wsReady(done.fail).then(ws => {
        ws.onmessage = msgEvt => {
          const msg = JSON.parse(msgEvt.data)
          expect('first' in msg || 'ping' in msg).toBeTruthy()
          if ('first' in msg) {
            expect(msg.first).toBeTruthy()
            done()
          } else if ('ping' in msg) {
            ws.send(JSON.stringify({pong: true}))
          } else {
            done.fail(msg)
          }
        }
        ws.send(JSON.stringify({open: randomKey()}))
      })
    })

    it('Should transmit data between opener and joining', done => {
      const key = randomKey()
      const msg0 = JSON.stringify({alice: 'Hello, it is me!'})
      const msg1 = JSON.stringify({bob: 'Who me?'})
      Promise.all([
        wsReady(done.fail),
        wsReady(done.fail)
      ]).then((wsArray) => {
        const msgSeq0 = (function * () {
          expect(yield).toEqual({first: true})
          wsArray[1].send(JSON.stringify({join: key}))
          const msg = yield
          expect(msg.data).toBeDefined()
          expect(msg.id).toBeDefined()
          expect(Object.keys(msg).length).toEqual(2)
          expect(msg.data).toEqual(msg1)
          wsArray[0].send(JSON.stringify({id: msg.id, data: msg0}))
        })()
        msgSeq0.next()
        wsArray[0].onmessage = msgEvt => {
          const msg = JSON.parse(msgEvt.data)
          if ('ping' in msg) {
            wsArray[0].send(JSON.stringify({pong: true}))
          } else {
            msgSeq0.next(msg)
          }
        }

        const msgSeq1 = (function * () {
          expect(yield).toEqual({first: false})
          wsArray[1].send(JSON.stringify({data: msg1}))
          expect(yield).toEqual({data: msg0})
          done()
        })()
        msgSeq1.next()
        wsArray[1].onmessage = msgEvt => {
          const msg = JSON.parse(msgEvt.data)
          if ('ping' in msg) {
            wsArray[0].send(JSON.stringify({pong: true}))
          } else {
            msgSeq1.next(msg)
          }
        }
        wsArray[0].send(JSON.stringify({open: key}))
      })
    })

    it('Should transmit data between 1 opener and 2 joinings', done => {
      const key = randomKey()
      const msg01 = JSON.stringify({alice: 'Hello, it is me!'})
      const msg02 = JSON.stringify({alice: 'Hello, it is me again!'})
      const msg1 = JSON.stringify({bob: 'Who me?'})
      const msg2 = JSON.stringify({jocker: 'Jocker!'})
      let done0
      let done1
      let done2
      Promise.all([
        new Promise((resolve, reject) => { done0 = resolve }),
        new Promise((resolve, reject) => { done1 = resolve }),
        new Promise((resolve, reject) => { done2 = resolve })
      ]).then(done)
      Promise.all([
        wsReady(done.fail),
        wsReady(done.fail),
        wsReady(done.fail)
      ]).then((wsArray) => {
        const msgSeq0 = (function * () {
          expect(yield).toEqual({first: true})
          wsArray[1].send(JSON.stringify({join: key}))

          let msg = yield
          expect(msg.data).toBeDefined()
          expect(msg.id).toBeDefined()
          expect(Object.keys(msg).length).toEqual(2)
          expect(msg.data).toEqual(msg2)
          wsArray[0].send(JSON.stringify({id: msg.id, data: msg02}))
          wsArray[1].send(JSON.stringify({data: msg1}))

          msg = yield
          expect(msg.data).toBeDefined()
          expect(msg.id).toBeDefined()
          expect(Object.keys(msg).length).toEqual(2)
          expect(msg.data).toEqual(msg1)
          wsArray[0].send(JSON.stringify({id: msg.id, data: msg01}))
          done0()
        })()
        msgSeq0.next()
        wsArray[0].onmessage = msgEvt => {
          const msg = JSON.parse(msgEvt.data)
          if ('ping' in msg) {
            wsArray[0].send(JSON.stringify({pong: true}))
          } else {
            msgSeq0.next(msg)
          }
        }

        const msgSeq1 = (function * () {
          expect(yield).toEqual({first: false})
          wsArray[2].send(JSON.stringify({join: key}))

          expect(yield).toEqual({data: msg01})
          done1()
        })()
        msgSeq1.next()
        wsArray[1].onmessage = msgEvt => {
          const msg = JSON.parse(msgEvt.data)
          if ('ping' in msg) {
            wsArray[0].send(JSON.stringify({pong: true}))
          } else {
            msgSeq1.next(msg)
          }
        }

        const msgSeq2 = (function * () {
          expect(yield).toEqual({first: false})
          wsArray[2].send(JSON.stringify({data: msg2}))

          expect(yield).toEqual({data: msg02})
          done2()
        })()
        msgSeq2.next()
        wsArray[2].onmessage = msgEvt => {
          const msg = JSON.parse(msgEvt.data)
          if ('ping' in msg) {
            wsArray[0].send(JSON.stringify({pong: true}))
          } else {
            msgSeq2.next(msg)
          }
        }

        wsArray[0].send(JSON.stringify({open: key}))
      })
    })

    it('Should join first after: someone else join first & close', done => {
      const key = randomKey()

      wsReady(done.fail)
      .then(ws => new Promise((resolve, reject) => {
        ws.onclose = resolve
        ws.onmessage = msgEvt => {
          const msg = JSON.parse(msgEvt.data)
          if ('first' in msg) {
            expect(msg.first).toBeTruthy()
            ws.close(1000)
          } else if ('ping' in msg) {
            ws.send(JSON.stringify({pong: true}))
          } else {
            done.fail(msg)
          }
        }
        ws.send(JSON.stringify({join: key}))
      }))
      .then(() => wsReady(done.fail))
      .then(ws => {
        ws.onmessage = msgEvt => {
          const msg = JSON.parse(msgEvt.data)
          if ('first' in msg) {
            expect(msg.first).toBeTruthy()
            done()
          } else if ('ping' in msg) {
            ws.send(JSON.stringify({pong: true}))
          } else {
            done.fail(msg)
          }
        }
        ws.send(JSON.stringify({join: key}))
      })
    })

    it('Should join first after: someone else open & close', done => {
      const key = randomKey()

      wsReady(done.fail)
      .then(ws => new Promise((resolve, reject) => {
        ws.onclose = resolve
        ws.onmessage = msgEvt => {
          const msg = JSON.parse(msgEvt.data)
          expect('first' in msg || 'ping' in msg).toBeTruthy()
          if ('first' in msg) {
            expect(msg.first).toBeTruthy()
            ws.close(1000)
            done()
          } else if ('ping' in msg) {
            ws.send(JSON.stringify({pong: true}))
          } else {
            done.fail(msg)
          }
        }
        ws.send(JSON.stringify({open: key}))
      }))
      .then(() => wsReady(done.fail))
      .then(ws => {
        ws.onmessage = msgEvt => {
          const msg = JSON.parse(msgEvt.data)
          expect('first' in msg || 'ping' in msg).toBeTruthy()
          if ('first' in msg) {
            expect(msg.first).toBeTruthy()
            ws.close(1000)
            done()
          } else if ('ping' in msg) {
            ws.send(JSON.stringify({pong: true}))
          } else {
            done.fail(msg)
          }
        }
        ws.send(JSON.stringify({join: key}))
      })
    })

    it('Should NOT join first after: someone else open', done => {
      const key = randomKey()
      wsReady(done.fail)
      .then(ws => new Promise((resolve, reject) => {
        ws.onmessage = msgEvt => {
          const msg = JSON.parse(msgEvt.data)
          expect('first' in msg || 'ping' in msg).toBeTruthy()
          if ('first' in msg) {
            expect(msg.first).toBeTruthy()
            resolve()
          } else if ('ping' in msg) {
            ws.send(JSON.stringify({pong: true}))
          } else {
            done.fail(msg)
          }
        }
        ws.send(JSON.stringify({open: key}))
      }))
      .then(() => wsReady(done.fail))
      .then(ws => {
        ws.onmessage = msgEvt => {
          const msg = JSON.parse(msgEvt.data)
          expect('first' in msg || 'ping' in msg).toBeTruthy()
          if ('first' in msg) {
            expect(msg.first).toBeFalsy()
            ws.close(1000)
            done()
          } else if ('ping' in msg) {
            ws.send(JSON.stringify({pong: true}))
          } else {
            done.fail(msg)
          }
        }
        ws.send(JSON.stringify({join: key}))
      })
    })

    it('Should open after join NOT first', done => {
      const key = randomKey()
      wsReady(done.fail)
      .then(ws => new Promise((resolve, reject) => {
        ws.onmessage = msgEvt => {
          const msg = JSON.parse(msgEvt.data)
          expect('first' in msg || 'ping' in msg).toBeTruthy()
          if ('first' in msg) {
            expect(msg.first).toBeTruthy()
            resolve()
          } else if ('ping' in msg) {
            ws.send(JSON.stringify({pong: true}))
          } else {
            done.fail(msg)
          }
        }
        ws.send(JSON.stringify({open: key}))
      }))
      .then(() => wsReady(done.fail))
      .then(ws => {
        const msgSeq = (function * (msg) {
          expect(yield).toEqual({first: false})
          ws.send(JSON.stringify({open: key}))
          expect(yield).toEqual({first: true})
          ws.close(1000)
          done()
        })()
        msgSeq.next()
        ws.onmessage = msgEvt => {
          const msg = JSON.parse(msgEvt.data)
          if ('ping' in msg) {
            ws.send(JSON.stringify({pong: true}))
          } else {
            msgSeq.next(msg)
          }
        }
        ws.send(JSON.stringify({join: key}))
      })
    })

    describe('Should fail to connect', () => {
      let ws
      beforeEach((done) => {
        ws = new Source(url)
        ws.onopen = done
      })

      it(`with code: ${SigverError.MESSAGE_ERROR}`, done => {
        ws.onclose = closeEvt => {
          expect(closeEvt.code).toEqual(SigverError.MESSAGE_ERROR)
          done()
        }
        ws.onerror = err => done.fail(err.message)
        ws.send('{open: ""')
      })

      it(`with code: ${SigverError.KEY_ERROR} because of key length`, done => {
        const key = 'Nullam et orci eu lorem consequat tincidunt vivamus et sagittis libero. Mauris aliquet magna magna sed nunc rhoncus pharetra. Pellentesque condimentum sem. In efficitur ligula tate urna. Maecenas laoreet massa vel lacinia pellentesque lorem ipsum dolor. Nullam et orci eu lorem consequat tincidunt. Vivamus et sagittis libero. Mauris aliquet magna magna sed nunc rhoncus amet feugiat tempus.Nullam et orci eu lorem consequat tincidunt vivamus et sagittis libero. Mauris aliquet magna magna sed nunc rhoncus pharetra. Pellentesque condimentum sem. In efficitur ligula tate urna. Maecenas laoreet massa vel lacinia pellentesque lorem ipsum dolor. Nullam et orci eu lorem consequat tincidunt. Vivamus et sagittis libero. Mauris aliquet magna magna sed nunc rhoncus amet feugiat tempus.'
        ws.onclose = closeEvt => {
          expect(closeEvt.code).toEqual(SigverError.KEY_ERROR)
          done()
        }
        ws.onerror = err => done.fail(err.message)
        ws.send(JSON.stringify({open: key}))
      })

      it(`with code: ${SigverError.KEY_ERROR} because of key type`, done => {
        ws.onclose = closeEvt => {
          expect(closeEvt.code).toEqual(SigverError.KEY_ERROR)
          done()
        }
        ws.onerror = err => done.fail(err.message)
        ws.send(JSON.stringify({open: 123456789}))
      })
    })
  })
}
