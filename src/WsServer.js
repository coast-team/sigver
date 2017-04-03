import IOJsonString from './IOJsonString'
import Channel from './Channel'
import SigverError from './SigverError'

/**
 * WebSocket server able to use ws or uws modules.
 */
export default class WsServer {
  constructor () {
    const Subject = require('rxjs/Rx').Subject
    this.onChannel = new Subject()
  }

  /**
   * Start the server.
   * @param {Object} options Options to be passed to ws or uws module
   * @param {Function} cb Callback to execute after the server has been started
   * @param {Object} [extraOptions]
   * @param {string} extraOptions.wsLib Specify which module to use (ws or uws)
   */
  start (options, cb = () => {}, extraOptions) {
    const defaultOptions = {
      perMessageDeflate: false
    }
    const settings = Object.assign({}, defaultOptions, options)
    let WebSocket = {}
    try {
      WebSocket = require(extraOptions.wsLib)
      console.log(`${extraOptions.wsLib} module is used for WebSocket server`)
    } catch (err) {
      const anotherLib = extraOptions.wsLib === 'uws' ? 'ws' : 'uws'
      console.log(`INFO: ${err.message}. Will use ${anotherLib} instead`)
      try {
        WebSocket = require(anotherLib)
      } catch (err2) {
        console.log(`ERROR: ${err2.message}. Thus the WebSocket server cannot be run`)
      }
    }
    const WebSocketServer = WebSocket.Server

    // Starting server
    this.server = new WebSocketServer(settings, cb)

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
