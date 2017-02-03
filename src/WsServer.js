import IOJsonString from './IOJsonString'
import ServerCore from './ServerCore'

/**
 * WebSocket server able to use ws or uws modules.
 */
export default class WsServer extends ServerCore {

  /**
   * Start the server.
   * @param {Object} options Options to be passed to ws or uws module
   * @param {Function} cb Callback to execute after the server has been started
   * @param {Object} [extraOptions]
   * @param {string} extraOptions.wsLib Specify which module to use (ws or uws)
   */
  start (options, cb = () => {}, extraOptions) {
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
    this.server = new WebSocketServer(options, cb)

    this.server.on('error', err => console.error(`Server error: ${err}`))

    this.server.on('connection', socket => {
      socket.onerror = err => {
        console.log(`Socket error while sending ${err.code}: ${err.reason}`)
      }
      socket.onmessage = msgEvent => {
        try {
          // Handle client message
          super.handleMessage(socket, new IOJsonString(msgEvent.data))
        } catch (err) {
          if (err.name !== 'SigverError') {
            console.log(`WebSocketServer: Error which not a SigverError instance: : ${err.message}`, err.stack)
          } else {
            console.log(err.message)
            socket.close(err.code, err.message)
          }
        }
      }
    })
  }
}
