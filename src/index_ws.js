import IOJsonString from './IOJsonString'
import ServerCore from './ServerCore'

/**
 * WebSocket server able to use ws or uws modules.
 */
class SignalingServer extends ServerCore {
  constructor (serverInstance) {
    super()
    this.server = serverInstance

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

export function run (serverInstance) {
  return new SignalingServer(serverInstance)
}
