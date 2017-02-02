import IOJsonString from './IOJsonString'
import Opener from './Opener'
import SigverError from './SigverError'

const openers = new Map()

/**
 * The core of the signaling server (WebSocket and SSE) containing the main logic
 */
export default class ServerCore {

  constructor () {
    this.server = null
  }

  handleMessage (source, ioMsg) {
    if (ioMsg.isToOpen()) {
      this.open(source, ioMsg)
    } else if (ioMsg.isToJoin()) {
      // While trying to join, if the key exists, then join. If the key does
      // not exist, then do as if the client want to open.
      if (openers.has(ioMsg.key)) {
        this.join(source, ioMsg)
      } else {
        this.open(source, ioMsg)
      }
    } else if (ioMsg.isToTransmitToOpener()) {
      this.transmitToOpener(source, ioMsg)
    } else if (ioMsg.isToTransmitToJoining()) {
      this.transmitToJoining(source, ioMsg)
    }
  }

  open (source, ioMsg) {
    const opener = new Opener(source)
    if (openers.has(ioMsg.key)) {
      openers.get(ioMsg.key).add(opener)
    } else {
      const setOfOpeners = new Set()
      setOfOpeners.add(opener)
      openers.set(ioMsg.key, setOfOpeners)
    }
    source.send(IOJsonString.msgOpened(true))
    opener.onclose = closeEvt => {
      const setOfOpeners = openers.get(ioMsg.key)
      setOfOpeners.delete(opener)
      if (setOfOpeners.size === 0) {
        openers.delete(ioMsg.key)
      }
    }
  }

  join (source, ioMsg) {
    openers.get(ioMsg.key).values().next().value.addJoining(source)
    source.send(IOJsonString.msgOpened(false))
  }

  transmitToJoining (source, ioMsg) {
    if (!('$opener' in source)) {
      throw new SigverError(SigverError.TRANSMIT_BEFORE_OPEN, 'Transmitting data before open')
    }
    const joining = source.$opener.getJoining(ioMsg.id)
    if (joining === undefined || !joining.opened) {
      source.$opener.source.send(ioMsg.msgUnavailable(ioMsg.id))
    }
    joining.source.send(ioMsg.msgToJoining())
  }

  transmitToOpener (source, ioMsg) {
    if (!('$joining' in source)) {
      throw new SigverError(SigverError.TRANSMIT_BEFORE_JOIN, 'Transmitting data before join')
    }
    const opener = source.$joining.opener
    if (opener === undefined || !opener.opened) {
      source.$joining.source.send(ioMsg.msgUnavailable())
    }
    opener.source.send(ioMsg.msgToOpener(source.$joining.id))
  }

  close (cb) {
    if (this.server !== null) {
      console.log('Server has stopped successfully')
      this.server.close(cb)
    }
  }
}
