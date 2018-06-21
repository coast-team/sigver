import * as h from './helper.js'

const ERR_KEY = 4741
const ERR_HEARTBEAT = 4742
const ERR_MESSAGE = 4743
const ERR_BLOCKING_MEMBER = 4744
const URL = 'ws://localhost:8010'

describe('Signaling WebSocket server', () => {
  const sockets = []

  afterEach(() =>
    sockets.filter((ws) => ws.readyState === WebSocket.OPEN).forEach((ws) => {
      ws.onmessage = undefined
      ws.onclose = undefined
      ws.onerror = undefined
      ws.close()
    }))

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

  describe('🙂 - group of 1 peer', () => {
    it('Should connect to the server', (done) => {
      const ws = new WebSocket(`${URL}/${h.randomKey()}`)
      sockets.push(ws)
      ws.onopen = done
    })

    it(
      'Should stay connected to the server after heartbeat timeout',
      (done) => {
        const ws = new WebSocket(`${URL}/${h.randomKey()}`)
        sockets.push(ws)
        ws.onmessage = () => {
          ws.send(h.encode({ heartbeat: true }))
        }
        setTimeout(() => {
          expect(ws.readyState).toEqual(WebSocket.OPEN)
          done()
        }, 17000)
      },
      20000
    )

    it('Should be the first in the group with empty members', (done) => {
      const ws = new WebSocket(`${URL}/${h.randomKey()}`)
      sockets.push(ws)
      ws.binaryType = 'arraybuffer'
      ws.onmessage = ({ data }) => {
        const msg = h.decode(data)
        if (msg.type === 'connected') {
          expect(msg.connected).toBeTruthy()
          done()
        }
      }
      ws.onopen = () => ws.send(h.encode({ connect: { id: 1, members: [] } }))
    })

    it('Should be the first in the group with a few members', (done) => {
      const ws = new WebSocket(`${URL}/${h.randomKey()}`)
      sockets.push(ws)
      ws.binaryType = 'arraybuffer'
      ws.onmessage = ({ data }) => {
        const msg = h.decode(data)
        if (msg.type === 'connected') {
          expect(msg.connected).toBeTruthy()
          done()
        }
      }
      ws.onopen = () => ws.send(h.encode({ connect: { id: 1, members: [123, 456, 789] } }))
    })

    it('Should receive the same response for several connect requests', (done) => {
      let responses = 0
      const ws = new WebSocket(`${URL}/${h.randomKey()}`)
      sockets.push(ws)
      ws.binaryType = 'arraybuffer'
      ws.onmessage = ({ data }) => {
        const msg = h.decode(data)
        if (msg.type === 'connected') {
          responses++
          expect(msg.connected).toBeTruthy()
          if (responses === 5) {
            done()
          }
        }
      }
      ws.onopen = () => {
        ws.send(h.encode({ connect: { id: 1, members: [123, 456, 789] } }))
        ws.send(h.encode({ connect: { id: 1, members: [123, 456, 789] } }))
        ws.send(h.encode({ connect: { id: 1, members: [] } }))
        ws.send(h.encode({ connect: { id: 1, members: [] } }))
        ws.send(h.encode({ connect: { id: 1, members: [321] } }))
      }
    })
  })

  describe('🙂 🙂 - group of 2 peers', () => {
    it('Should NOT be the first in the group', (done) => {
      const key = h.keyPrefix + 'Secrets of the stars'
      const secondePeer = () => {
        const ws = new WebSocket(`${URL}/${key}`)
        sockets.push(ws)
        ws.binaryType = 'arraybuffer'
        ws.onmessage = ({ data }) => {
          const msg = h.decode(data)
          if (msg.type === 'connected') {
            expect(msg.connected).toBeFalsy()
            done()
          }
        }
        ws.onopen = () => ws.send(h.encode({ connect: { id: 2, members: [] } }))
      }

      const ws = new WebSocket(`${URL}/${key}`)
      sockets.push(ws)
      ws.binaryType = 'arraybuffer'
      ws.onmessage = ({ data }) => {
        const msg = h.decode(data)
        if (msg.type === 'connected') {
          secondePeer()
        }
      }
      ws.onopen = () => ws.send(h.encode({ connect: { id: 1, members: [] } }))
    })

    it('Should replace the blocking member', (done) => {
      let counter = 0
      const key = h.keyPrefix + 'Ira wolf'
      const queue = new h.Queue(2, done)
      const secondePeer = () => {
        const ws = new WebSocket(`${URL}/${key}`)
        sockets.push(ws)
        ws.binaryType = 'arraybuffer'
        ws.onmessage = ({ data }) => {
          const msg = h.decode(data)
          if (msg.type === 'connected') {
            counter++
            if (counter === 2) {
              expect(msg.connected).toBeTruthy()
              queue.done()
            }
          }
        }
        ws.onopen = () => {
          ws.send(h.encode({ connect: { id: 2, members: [] } }))
          ws.send(h.encode({ connect: { id: 2, members: [] } }))
        }
      }

      const ws = new WebSocket(`${URL}/${key}`)
      sockets.push(ws)
      ws.binaryType = 'arraybuffer'
      ws.onmessage = ({ data }) => {
        const msg = h.decode(data)
        if (msg.type === 'connected') {
          secondePeer()
        }
      }
      ws.onopen = () => ws.send(h.encode({ connect: { id: 1, members: [] } }))
      ws.onclose = ({ code }) => {
        expect(code).toEqual(ERR_BLOCKING_MEMBER)
        queue.done()
      }
    })

    it('Should get connected=true when members have at least one member in common', (done) => {
      const key = h.keyPrefix + 'Sunscreen'
      const secondePeer = () => {
        const ws = new WebSocket(`${URL}/${key}`)
        sockets.push(ws)
        ws.binaryType = 'arraybuffer'
        ws.onmessage = ({ data }) => {
          const msg = h.decode(data)
          if (msg.type === 'connected') {
            expect(msg.connected).toBeTruthy()
            done()
          }
        }
        ws.onopen = () => ws.send(h.encode({ connect: { id: 2, members: [1] } }))
      }

      const ws = new WebSocket(`${URL}/${key}`)
      sockets.push(ws)
      ws.binaryType = 'arraybuffer'
      ws.onmessage = ({ data }) => {
        const msg = h.decode(data)
        if (msg.type === 'connected') {
          secondePeer()
        }
      }
      ws.onopen = () => ws.send(h.encode({ connect: { id: 1, members: [] } }))
    })

    it('Should exchange data', (done) => {
      const key = h.keyPrefix + 'The Civil Wars'
      const msg1 = h.randomBytes()
      const msg2 = h.randomBytes()
      const secondePeer = () => {
        const ws = new WebSocket(`${URL}/${key}`)
        sockets.push(ws)
        ws.binaryType = 'arraybuffer'
        ws.onmessage = ({ data }) => {
          const msg = h.decode(data)
          if (msg.type === 'connected') {
            ws.send(h.encode({ content: { recipientId: 1, data: msg2 } }))
          } else if (msg.type === 'content') {
            expect(msg.content.senderId).toEqual(0)
            expect(msg.content.data).toEqual(msg1)
            done()
          }
        }
        ws.onopen = () => ws.send(h.encode({ connect: { id: 2, members: [] } }))
      }

      const ws = new WebSocket(`${URL}/${key}`)
      sockets.push(ws)
      ws.binaryType = 'arraybuffer'
      ws.onmessage = ({ data }) => {
        const msg = h.decode(data)
        if (msg.type === 'connected') {
          secondePeer()
        } else if (msg.type === 'content') {
          expect(msg.content.data).toEqual(msg2)
          ws.send(h.encode({ content: { recipientId: msg.content.senderId, data: msg1 } }))
        }
      }
      ws.onopen = () => ws.send(h.encode({ connect: { id: 1, members: [] } }))
    })

    it('Should still be able to exchange data after connected', (done) => {
      const key = h.keyPrefix + 'По улице моей который год'
      const msg1 = h.randomBytes()
      const msg2 = h.randomBytes()
      const secondePeer = () => {
        const ws = new WebSocket(`${URL}/${key}`)
        sockets.push(ws)
        ws.binaryType = 'arraybuffer'
        ws.onmessage = ({ data }) => {
          const msg = h.decode(data)
          if (msg.type === 'connected') {
            if (!msg.connected) {
              ws.send(h.encode({ connect: { id: 2, members: [1] } }))
              ws.send(h.encode({ content: { recipientId: 1, data: msg2 } }))
            }
          } else if (msg.type === 'content') {
            expect(msg.content.senderId).toEqual(0)
            expect(msg.content.data).toEqual(msg1)
            done()
          }
        }
        ws.onopen = () => ws.send(h.encode({ connect: { members: [] } }))
      }

      const ws = new WebSocket(`${URL}/${key}`)
      sockets.push(ws)
      ws.binaryType = 'arraybuffer'
      ws.onmessage = ({ data }) => {
        const msg = h.decode(data)
        if (msg.type === 'connected') {
          secondePeer()
        } else if (msg.type === 'content') {
          expect(msg.content.data).toEqual(msg2)
          ws.send(h.encode({ content: { recipientId: msg.content.senderId, data: msg1 } }))
        }
      }
      ws.onopen = () => ws.send(h.encode({ connect: { id: 1, members: [] } }))
    })

    it('Should NOT be able to exchange data after sent the last data', (done) => {
      const key = h.keyPrefix + 'Intel Software'
      const msg1 = h.randomBytes()
      const msg2 = h.randomBytes()
      const secondePeer = () => {
        const ws = new WebSocket(`${URL}/${key}`)
        sockets.push(ws)
        ws.binaryType = 'arraybuffer'
        const onmessageGen = (function*() {
          let msg = yield
          expect(msg.type).toEqual('connected')
          expect(msg.connected).toBeFalsy()
          ws.send(h.encode({ content: { recipientId: 1, lastData: true, data: msg1 } }))
          ws.send(h.encode({ content: { recipientId: 1, data: msg2 } }))
        })()
        onmessageGen.next()
        ws.onmessage = ({ data }) => onmessageGen.next(h.decode(data))
        ws.onopen = () => ws.send(h.encode({ connect: { members: [] } }))
      }

      const ws = new WebSocket(`${URL}/${key}`)
      sockets.push(ws)
      ws.binaryType = 'arraybuffer'
      const onmessageGen = (function*() {
        let msg = yield
        expect(msg.type).toEqual('connected')
        expect(msg.connected).toBeTruthy()
        secondePeer()

        msg = yield
        expect(msg.type).toEqual('content')
        // expect(msg.content.data).toEqual(msg1)

        msg = yield
        fail('Received a message which should not be received')
      })()
      onmessageGen.next()
      ws.onmessage = ({ data }) => onmessageGen.next(h.decode(data))
      ws.onopen = () => ws.send(h.encode({ connect: { id: 1, members: [] } }))
      setTimeout(done, 2000)
    })
  })

  describe('🙂 🙂 🙂 - group of 3 peers', () => {
    it('Should try all members', (done) => {
      const key = h.keyPrefix + 'At last'
      const msg1 = h.randomBytes()
      const msg1back = h.randomBytes()
      const msg2 = h.randomBytes()
      const msg2back = h.randomBytes()
      const msg3 = h.randomBytes()
      const msg3back = h.randomBytes()

      // Code fot the Third peer
      const thirdPeer = () => {
        const ws = new WebSocket(`${URL}/${key}`)
        sockets.push(ws)
        ws.binaryType = 'arraybuffer'
        const onmessageGen = (function*() {
          let msg = yield
          expect(msg.type).toEqual('connected')
          expect(msg.connected).toBeFalsy()
          ws.send(h.encode({ content: { data: msg1 } }))

          msg = yield
          expect(msg.type).toEqual('content')
          expect(msg.content.data).toEqual(msg1back)
          ws.send(h.encode({ connect: { members: [] } }))

          msg = yield
          expect(msg.type).toEqual('connected')
          expect(msg.connected).toBeFalsy()
          ws.send(h.encode({ content: { data: msg2 } }))

          msg = yield
          expect(msg.type).toEqual('content')
          expect(msg.content.data).toEqual(msg2back)
          ws.send(h.encode({ connect: { members: [] } }))

          msg = yield
          expect(msg.type).toEqual('connected')
          expect(msg.connected).toBeFalsy()
          ws.send(h.encode({ content: { data: msg3 } }))

          msg = yield
          expect(msg.type).toEqual('content')
          expect(msg.content.data).toEqual(msg3back)
          done()
        })()
        onmessageGen.next()
        ws.onmessage = ({ data }) => onmessageGen.next(h.decode(data))
        ws.onopen = () => ws.send(h.encode({ connect: { members: [] } }))
        ws.onclose = () => fail('Third peer closed the connection')
      }

      // Code fot the Second peer
      const secondePeer = () => {
        const ws = new WebSocket(`${URL}/${key}`)
        sockets.push(ws)
        ws.binaryType = 'arraybuffer'
        const onmessageGen = (function*() {
          let msg = yield
          expect(msg.type).toEqual('connected')
          expect(msg.connected).toBeTruthy()
          thirdPeer()

          msg = yield
          expect(msg.type).toEqual('content')
          expect(msg.content.data).toEqual(msg2)
          ws.send(h.encode({ content: { recipientId: msg.content.senderId, data: msg2back } }))

          msg = yield
          fail('Second peer should no longer receive any message')
        })()
        onmessageGen.next()
        ws.onmessage = ({ data }) => onmessageGen.next(h.decode(data))
        ws.onopen = () => ws.send(h.encode({ connect: { id: 2, members: [1] } }))
        ws.onclose = () => fail('Second peer closed the connection')
      }

      // Code fot the First peer
      const ws = new WebSocket(`${URL}/${key}`)
      sockets.push(ws)
      ws.binaryType = 'arraybuffer'
      const onmessageGen = (function*() {
        let msg = yield
        expect(msg.type).toEqual('connected')
        expect(msg.connected).toBeTruthy()
        secondePeer()

        msg = yield
        expect(msg.type).toEqual('content')
        expect(msg.content.data).toEqual(msg1)
        ws.send(h.encode({ content: { recipientId: msg.content.senderId, data: msg1back } }))

        msg = yield
        expect(msg.type).toEqual('content')
        expect(msg.content.data).toEqual(msg3)
        ws.send(h.encode({ content: { recipientId: msg.content.senderId, data: msg3back } }))

        msg = yield
        fail('First peer should no longer receive any message')
      })()
      onmessageGen.next()
      ws.onmessage = ({ data }) => onmessageGen.next(h.decode(data))
      ws.onopen = () => ws.send(h.encode({ connect: { id: 1, members: [] } }))
      ws.onclose = () => fail('First peer closed the connection')
    })

    it('Should exchange data with two joining peers', (done) => {
      const key = h.keyPrefix + 'carramba'
      let queueInit = new h.Queue(2, () => ws2.send(h.encode({ content: { data: msg2 } })))
      const msg2 = h.randomBytes()
      const msg2back = h.randomBytes()
      const msg3 = h.randomBytes()
      const msg3back = h.randomBytes()
      let ws2, ws3

      // Code fot the Third peer
      const thirdPeer = () => {
        const ws = new WebSocket(`${URL}/${key}`)
        ws3 = ws
        sockets.push(ws)
        ws.binaryType = 'arraybuffer'
        ws.onopen = () => ws.send(h.encode({ connect: { members: [] } }))
        ws.onclose = () => fail('Third peer closed the connection')
        const onmessageGen = (function*() {
          let msg = yield
          expect(msg.type).toEqual('connected')
          expect(msg.connected).toBeFalsy()
          queueInit.done()

          msg = yield
          expect(msg.type).toEqual('content')
          expect(msg.content.data).toEqual(msg3back)
          done()
        })()
        onmessageGen.next()
        ws.onmessage = ({ data }) => onmessageGen.next(h.decode(data))
      }

      // Code fot the Second peer
      const secondePeer = async () => {
        const ws = new WebSocket(`${URL}/${key}`)
        ws2 = ws
        sockets.push(ws)
        ws.binaryType = 'arraybuffer'
        ws.onopen = () => ws.send(h.encode({ connect: { members: [] } }))
        ws.onclose = () => fail('Second peer closed the connection')
        const onmessageGen = (function*() {
          let msg = yield
          expect(msg.type).toEqual('connected')
          expect(msg.connected).toBeFalsy()
          queueInit.done()

          msg = yield
          expect(msg.type).toEqual('content')
          expect(msg.content.data).toEqual(msg2back)
          ws3.send(h.encode({ content: { data: msg3 } }))

          msg = yield
          fail('Second peer should no longer receive any message')
        })()
        onmessageGen.next()
        ws.onmessage = ({ data }) => onmessageGen.next(h.decode(data))
      }

      // Code fot the First peer
      const ws = new WebSocket(`${URL}/${key}`)
      sockets.push(ws)
      ws.binaryType = 'arraybuffer'
      const onmessageGen = (function*() {
        let msg = yield
        expect(msg.type).toEqual('connected')
        expect(msg.connected).toBeTruthy()
        secondePeer()
        thirdPeer()

        msg = yield
        expect(msg.type).toEqual('content')
        expect(msg.content.data).toEqual(msg2)
        ws.send(h.encode({ content: { recipientId: msg.content.senderId, data: msg2back } }))

        msg = yield
        expect(msg.type).toEqual('content')
        expect(msg.content.data).toEqual(msg3)
        ws.send(h.encode({ content: { recipientId: msg.content.senderId, data: msg3back } }))

        msg = yield
        fail('First peer should no longer receive any message')
      })()
      onmessageGen.next()
      ws.onmessage = ({ data }) => onmessageGen.next(h.decode(data))
      ws.onopen = () => ws.send(h.encode({ connect: { id: 1, members: [] } }))
      ws.onclose = () => fail('First peer closed the connection')
    })
  })
})
