import IOJsonString from './IOJsonString'
import Opener from './Opener'
import SigverError from './error/SigverError'
import WSError from '../src/error/WSError'

let WebSocket = {}
try {
  WebSocket = require('uws')
} catch (err) {
  console.log('INFO: uws package is not installed properly, thus WebSocket server could not be run')
}
const WebSocketServer = WebSocket.Server

const openers = new Map()

export default class WSServer {

  constructor () {
    this.server = null
  }

  static start (options, cb = () => {}) {
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
          } else if (err.code !== SigverError.JOINING_GONE) {
            console.log(err.message)
            socket.close(WSError.code(err.code), err.message)
          } else {
            socket.send(IOJsonString.msgJoiningUnavailable(), errorOnSendCB)
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
  if (openers.has(ioMsg.key)) {
    socket.send(IOJsonString.msgIsKeyOk(false), errorOnSendCB)
    throw new SigverError(SigverError.KEY_FOR_OPEN_EXISTS, `The key "${ioMsg.key}" has already been used for open`)
  }
  socket.send(IOJsonString.msgIsKeyOk(true), errorOnSendCB)
  const opener = new Opener(socket)
  opener.onclose = closeEvt => openers.delete(ioMsg.key)
  openers.set(ioMsg.key, opener)
}

function join (socket, ioMsg) {
  if (!openers.has(ioMsg.key)) {
    socket.send(IOJsonString.msgIsKeyOk(false), errorOnSendCB)
    throw new SigverError(SigverError.KEY_FOR_JOIN_UNKNOWN, 'Unknown key')
  }
  socket.send(IOJsonString.msgIsKeyOk(true), errorOnSendCB)
  const opener = openers.get(ioMsg.key)
  opener.addJoining(socket)
}

function transmitToJoining (socket, ioMsg) {
  if (!('$opener' in socket)) {
    throw new SigverError(SigverError.TRANSMIT_BEFORE_OPEN, 'Transmitting data before open')
  }
  const joining = socket.$opener.getJoining(ioMsg.id)
  if (joining === undefined || joining.source.readyState !== WebSocket.OPEN) {
    throw new SigverError(SigverError.JOINING_GONE, 'Joining is no longer available')
  }
  joining.source.send(ioMsg.msgToJoining(), errorOnSendCB)
}

function transmitToOpener (socket, ioMsg) {
  if (!('$joining' in socket)) {
    throw new SigverError(SigverError.TRANSMIT_BEFORE_JOIN, 'Transmitting data before join')
  }
  const opener = socket.$joining.opener
  if (opener === undefined || opener.source.readyState !== WebSocket.OPEN) {
    throw new SigverError(SigverError.OPENER_GONE, 'Opener is no longer available')
  }
  opener.source.send(ioMsg.msgToOpener(socket.$joining.id), errorOnSendCB)
}
