import IOJsonString from './IOJsonString'
import Opener from './Opener'
import SigverError from './error/SigverError'
import WSError from '../src/error/WSError'

const openers = new Map()

export default class WSServer {

  constructor () {
    this.server = null
  }

  static start (options, cb = () => {}, extraOptions) {
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
        console.log(`ERROR: ${err2.message}. Thus the server cannot be run`)
      }
    }
    const WebSocketServer = WebSocket.Server

    this.server = new WebSocketServer(options, cb)

    this.server.on('error', err => console.error(`Server error: ${err}`))

    this.server.on('connection', socket => {
      socket.onmessage = msgEvent => {
        try {
          const ioMsg = new IOJsonString(msgEvent.data)
          if (ioMsg.isToOpen()) {
            open(socket, ioMsg)
          } else if (ioMsg.isToJoin()) {
            join(socket, ioMsg)
          } else if (ioMsg.isToTransmitToOpener()) {
            transmitToOpener(socket, ioMsg)
          } else if (ioMsg.isToTransmitToJoining()) {
            transmitToJoining(socket, ioMsg)
          }
        } catch (err) {
          if (err.name !== 'SigverError') {
            console.log('Error which not a SigverError instance: ', err)
          } else {
            console.log(err.message)
            socket.close(WSError.code(err.code), err.message)
          }
        }
      }
    })
  }

  close (cb) {
    console.log('Server has stopped successfully')
    this.server.close(cb)
  }

}

function errorOnSendCB (err) {
  if (err) {
    console.log(`Socket error while sending ${err.code}: ${err.reason}`)
  }
}

function open (socket, ioMsg) {
  const opener = new Opener(socket)
  if (openers.has(ioMsg.key)) {
    openers.get(ioMsg.key).add(opener)
  } else {
    const setOfOpeners = new Set()
    setOfOpeners.add(opener)
    openers.set(ioMsg.key, setOfOpeners)
  }
  socket.send(IOJsonString.msgOpened(true), errorOnSendCB)
  opener.onclose = closeEvt => {
    const setOfOpeners = openers.get(ioMsg.key)
    setOfOpeners.delete(opener)
    if (setOfOpeners.size === 0) {
      openers.delete(ioMsg.key)
    }
  }
}

function join (socket, ioMsg) {
  if (openers.has(ioMsg.key)) {
    openers.get(ioMsg.key).values().next().value.addJoining(socket)
    socket.send(IOJsonString.msgOpened(false), errorOnSendCB)
  } else {
    open(socket, ioMsg)
  }
}

function transmitToJoining (socket, ioMsg) {
  if (!('$opener' in socket)) {
    throw new SigverError(SigverError.TRANSMIT_BEFORE_OPEN, 'Transmitting data before open')
  }
  const joining = socket.$opener.getJoining(ioMsg.id)
  if (joining === undefined || !joining.opened) {
    // The connection with the opener has been closed, so the server can no longer transmit him any data.
    socket.$opener.source.send(ioMsg.msgUnavailable(ioMsg.id))
  }
  joining.source.send(ioMsg.msgToJoining(), errorOnSendCB)
}

function transmitToOpener (socket, ioMsg) {
  if (!('$joining' in socket)) {
    throw new SigverError(SigverError.TRANSMIT_BEFORE_JOIN, 'Transmitting data before join')
  }
  const opener = socket.$joining.opener
  if (opener === undefined || !opener.opened) {
    // Same, as previous for the joining
    socket.$joining.source.send(ioMsg.msgUnavailable())
  }
  opener.source.send(ioMsg.msgToOpener(socket.$joining.id), errorOnSendCB)
}
