import IOJsonString from './IOJsonString'
import Channel from './Channel'
import SigverError from './SigverError'

/**
 * WebSocket server able to use ws or uws modules.
 */
export default class WsServer {
  constructor (httpServer, host, port) {
    this.httpServer = httpServer
    this.host = host
    this.port = port
    const Subject = require('rxjs/Rx').Subject
    this.onChannel = new Subject()
  }

  /**
   * Start the server.
   * @param {Function} cb Callback to execute after the server has been started
   */
  start (cb = () => {}) {
    this.httpServer.listen(this.port, this.host, cb)
    const WebSocketServer = require('uws').Server

    // Starting server
    this.server = new WebSocketServer({
      perMessageDeflate: false,
      server: this.httpServer
    })

    this.server.on('error', err => {
      console.error(`Server error: ${err}`)
      this.onChannel.error(err)
    })

    this.server.on('connection', socket => {
      const channel = new Channel(socket)
      socket.onmessage = evt => {
        try {
          channel.next(new IOJsonString(evt.data))
        } catch (err) {
          socket.close(err.code, err.message)
        }
      }
      socket.onerror = err => channel.error(err)
      socket.onclose = closeEvt => {
        if (closeEvt.code === 1000) {
          channel.complete()
        } else {
          channel.error(new SigverError(closeEvt.code, closeEvt.reason))
        }
      }
      channel.send = msg => socket.send(msg)
      channel.close = (code, reason) => socket.close(code, reason)
      this.onChannel.next(channel)
    })
  }

  close (cb) {
    if (this.server !== null) {
      console.log('Server has stopped successfully')
      this.server.close(cb)
      this.onChannel.complete()
    }
  }
}
