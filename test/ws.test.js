import SigverError from '../src/error/SigverError'
import WSError from '../src/error/WSError'
import { randomKey } from './util.js'

const URL = 'ws://localhost:8034'

describe('WebSocket', () => {
  const sockets = new Set()

  function wsReady (fail) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(URL)
      ws.onopen = () => { resolve(ws) }
      ws.onerror = err => fail(err.message)
      ws.onclose = closeEvt => fail(closeEvt.reason)
      sockets.add(ws)
    })
  }

  beforeEach(() => {
    sockets.clear()
  })

  afterEach(() => {
    for (let ws of sockets) {
      ws.onclose = () => {}
      ws.close()
    }
  })

  it('Should send join', done => {
    wsReady(done.fail).then(ws => {
      ws.onmessage = msgEvt => {
        expect(JSON.parse(msgEvt.data)).toEqual({opened: true})
        done()
      }
      ws.send(JSON.stringify({join: randomKey()}))
    })
  })

  it('Should send open', done => {
    wsReady(done.fail).then(ws => {
      ws.onmessage = msgEvt => {
        expect(JSON.parse(msgEvt.data)).toEqual({opened: true})
        done()
      }
      ws.send(JSON.stringify({open: randomKey()}))
    })
  })

  it('Should transmit data', done => {
    const key = randomKey()
    const msg0 = JSON.stringify({alice: 'Hello, it is me!'})
    const msg1 = JSON.stringify({bob: 'Who me?'})
    Promise.all([
      wsReady(done.fail),
      wsReady(done.fail)
    ]).then((wsArray) => {
      const msgSeq1 = (function* () {
        expect(yield).toEqual({opened: true})
        wsArray[1].send(JSON.stringify({join: key}))
        const msg = yield
        expect(msg.data).toBeDefined()
        expect(msg.id).toBeDefined()
        expect(typeof msg.id).toEqual('number')
        expect(Object.keys(msg).length).toEqual(2)
        expect(msg.data).toEqual(msg1)
        wsArray[0].send(JSON.stringify({id: msg.id, data: msg0}))
      })()
      msgSeq1.next()
      wsArray[0].onmessage = msgEvt => msgSeq1.next(JSON.parse(msgEvt.data))

      const msgSeq2 = (function* () {
        expect(yield).toEqual({opened: false})
        wsArray[1].send(JSON.stringify({data: msg1}))
        expect(yield).toEqual({data: msg0})
        done()
      })()
      msgSeq2.next()
      wsArray[1].onmessage = msgEvt => msgSeq2.next(JSON.parse(msgEvt.data))
      wsArray[0].send(JSON.stringify({join: key}))
    })
  })

  it('Should join first after: someone else join first & close', done => {
    const key = randomKey()

    wsReady(done.fail)
    .then(ws => new Promise((resolve, reject) => {
      ws.onclose = resolve
      ws.onmessage = msgEvt => {
        expect(JSON.parse(msgEvt.data)).toEqual({opened: true})
        ws.close()
      }
      ws.send(JSON.stringify({join: key}))
    }))
    .then(() => wsReady(done.fail))
    .then(ws => {
      ws.onmessage = msgEvt => {
        expect(JSON.parse(msgEvt.data)).toEqual({opened: true})
        done()
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
        expect(JSON.parse(msgEvt.data)).toEqual({opened: true})
        ws.close()
      }
      ws.send(JSON.stringify({open: key}))
    }))
    .then(() => wsReady(done.fail))
    .then(ws => {
      ws.onmessage = msgEvt => {
        expect(JSON.parse(msgEvt.data)).toEqual({opened: true})
        done()
      }
      ws.send(JSON.stringify({join: key}))
    })
  })

  it('Should NOT join first after: someone else join first', done => {
    const key = randomKey()
    wsReady(done.fail)
    .then(ws => new Promise((resolve, reject) => {
      ws.onmessage = msgEvt => {
        expect(JSON.parse(msgEvt.data)).toEqual({opened: true})
        resolve()
      }
      ws.send(JSON.stringify({join: key}))
    }))
    .then(() => wsReady(done.fail))
    .then(ws => {
      ws.onmessage = msgEvt => {
        expect(JSON.parse(msgEvt.data)).toEqual({opened: false})
        done()
      }
      ws.send(JSON.stringify({join: key}))
    })
  })

  it('Should NOT join first after: someone else open', done => {
    const key = randomKey()
    wsReady(done.fail)
    .then(ws => new Promise((resolve, reject) => {
      ws.onmessage = msgEvt => {
        expect(JSON.parse(msgEvt.data)).toEqual({opened: true})
        resolve()
      }
      ws.send(JSON.stringify({open: key}))
    }))
    .then(() => wsReady(done.fail))
    .then(ws => {
      ws.onmessage = msgEvt => {
        expect(JSON.parse(msgEvt.data)).toEqual({opened: false})
        done()
      }
      ws.send(JSON.stringify({join: key}))
    })
  })

  it('Should open after join NOT first', done => {
    const key = randomKey()
    wsReady(done.fail)
    .then(ws => new Promise((resolve, reject) => {
      ws.onmessage = msgEvt => {
        expect(JSON.parse(msgEvt.data)).toEqual({opened: true})
        resolve()
      }
      ws.send(JSON.stringify({open: key}))
    }))
    .then(() => wsReady(done.fail))
    .then(ws => {
      const msgSeq = (function* (msg) {
        expect(yield).toEqual({opened: false})
        ws.send(JSON.stringify({open: key}))
        expect(yield).toEqual({opened: true})
        done()
      })()
      msgSeq.next()
      ws.onmessage = msgEvt => msgSeq.next(JSON.parse(msgEvt.data))
      ws.send(JSON.stringify({join: key}))
    })
  })

  describe('Should fail to connect', () => {
    let ws
    beforeEach((done) => {
      ws = new WebSocket(URL)
      ws.onopen = done
    })

    it(`with code: ${SigverError.MESSAGE_ERROR}`, done => {
      ws.onclose = closeEvt => {
        expect(closeEvt.code).toEqual(WSError.code(SigverError.MESSAGE_ERROR))
        done()
      }
      ws.onerror = err => done.fail(err.message)
      ws.send('{open: ""')
    })

    it(`with code: ${SigverError.KEY_ERROR} because of key length`, done => {
      const key = 'Nullam et orci eu lorem consequat tincidunt vivamus et sagittis libero. Mauris aliquet magna magna sed nunc rhoncus pharetra. Pellentesque condimentum sem. In efficitur ligula tate urna. Maecenas laoreet massa vel lacinia pellentesque lorem ipsum dolor. Nullam et orci eu lorem consequat tincidunt. Vivamus et sagittis libero. Mauris aliquet magna magna sed nunc rhoncus amet feugiat tempus.Nullam et orci eu lorem consequat tincidunt vivamus et sagittis libero. Mauris aliquet magna magna sed nunc rhoncus pharetra. Pellentesque condimentum sem. In efficitur ligula tate urna. Maecenas laoreet massa vel lacinia pellentesque lorem ipsum dolor. Nullam et orci eu lorem consequat tincidunt. Vivamus et sagittis libero. Mauris aliquet magna magna sed nunc rhoncus amet feugiat tempus.'
      ws.onclose = closeEvt => {
        expect(closeEvt.code).toEqual(WSError.code(SigverError.KEY_ERROR))
        done()
      }
      ws.onerror = err => done.fail(err.message)
      ws.send(JSON.stringify({open: key}))
    })

    it(`with code: ${SigverError.KEY_ERROR} because of key type`, done => {
      ws.onclose = closeEvt => {
        expect(closeEvt.code).toEqual(WSError.code(SigverError.KEY_ERROR))
        done()
      }
      ws.onerror = err => done.fail(err.message)
      ws.send(JSON.stringify({open: 123456789}))
    })

    it(`with code: ${SigverError.TRANSMIT_BEFORE_OPEN}`, done => {
      ws.onclose = closeEvt => {
        expect(closeEvt.code).toEqual(WSError.code(SigverError.TRANSMIT_BEFORE_OPEN))
        done()
      }
      ws.onerror = err => done.fail(err.message)
      ws.send(JSON.stringify({id: 124, data: 'something'}))
    })

    it(`with code: ${SigverError.TRANSMIT_BEFORE_JOIN}`, done => {
      ws.onclose = closeEvt => {
        expect(closeEvt.code).toEqual(WSError.code(SigverError.TRANSMIT_BEFORE_JOIN))
        done()
      }
      ws.onerror = err => done.fail(err.message)
      ws.send(JSON.stringify({data: 'something'}))
    })
  })
})
