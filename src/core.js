import IOJsonString from './IOJsonString'
import Opener from './Opener'
import SigverError from './SigverError'

const WebSocketServer = require('uws').Server

const openers = new Map()

class Sigver {
  constructor (options, onStart = () => {}) {
    this.server = new WebSocketServer(options, () => {
      console.log(`Server is running on: ws://${options.host}:${options.port}`)
      onStart()
    })

    this.server.on('error', err => console.error(`Server error: ${err}`))

    this.server.on('connection', source => {
      source.on('message', (data, flags) => {
        try {
          const msg = new IOJsonString(data)
          if (msg.isToOpen()) {
            open(source, msg)
          } else if (msg.isToJoin()) {
            join(source, msg)
          } else if (msg.isToTransmitToOpener()) {
            transmitToOpener(source, msg)
          } else if (msg.isToTransmitToJoining()) {
            transmitToJoining(source, msg)
          }
        } catch (err) {
          if (err.name !== 'SigverError') {
            console.log('Error which not a SigverError instance: ', err)
          } else if (err.code !== SigverError.JOINING_NO_LONGER_AVAILABLE) {
            console.log(err.message)
            source.close(err.code, err.message)
          }
        }
      })
    })
  }

  close (cb) {
    console.log('Server has stopped successfully')
    this.server.close(cb)
  }

}

function open (source, ioMsg) {
  if (openers.has(ioMsg.key)) {
    source.send(ioMsg.msgIsKeyOk(false))
    throw new SigverError(SigverError.KEY_FOR_OPEN_EXISTS,
      `The key "${ioMsg.key}"" exists already`
    )
  }
  source.send(ioMsg.msgIsKeyOk(true))
  const opener = new Opener(source)
  opener.onclose = closeEvt => openers.delete(ioMsg.key)
  openers.set(ioMsg.key, opener)
}

function join (source, ioMsg) {
  if (!openers.has(ioMsg.key)) {
    source.send(ioMsg.msgIsKeyOk(false))
    throw new SigverError(SigverError.KEY_FOR_JOIN_UNKNOWN, 'Unknown key')
  }
  source.send(ioMsg.msgIsKeyOk(true))
  openers.get(ioMsg.key).addJoining(source)
}

function transmitToJoining (source, ioMsg) {
  if (!('$opener' in source)) {
    throw new SigverError(SigverError.TRANSMIT_BEFORE_OPEN, 'Transmitting data before open')
  }
  console.log('Transmit to joining: ', ioMsg)
  const joining = source.$opener.getJoining(ioMsg.id)
  if (joining === undefined) {
    throw new SigverError(SigverError.JOINING_NO_LONGER_AVAILABLE, 'Joining is no longer available')
  }
  console.log('Sending to joining: ' + ioMsg.msgToJoining(), joining)
  joining.source.send(ioMsg.msgToJoining())
}

function transmitToOpener (source, ioMsg) {
  if (!('$joining' in source)) {
    throw new SigverError(SigverError.TRANSMIT_BEFORE_JOIN, 'Transmitting data before join')
  }
  const opener = source.$joining.opener
  if (opener === undefined) {
    throw new SigverError(SigverError.OPENER_NO_LONGER_AVAILABLE, 'Opener is no longer available')
  }
  opener.source.send(ioMsg.msgToOpener(source.$joining.id))
}

export default Sigver
