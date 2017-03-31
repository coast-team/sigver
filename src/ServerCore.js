import IOJsonString from './IOJsonString'

const openersMap = new Map()

/**
 * The core of the signaling server (WebSocket and SSE) containing the main logic
 */
export default class ServerCore {
  init (channel) {
    channel.subscribe(
      ioMsg => {
        if (ioMsg.isToOpen()) {
          this.open(channel, ioMsg)
        } else if (ioMsg.isToJoin()) {
          this.join(channel, ioMsg)
        }
      },
      err => {
        console.log('ServerCore init: ' + channel.id + ' | ' + err.message)
        this.clean(channel)
      },
      () => this.clean(channel)
    )
  }

  open (channel, ioMsg) {
    channel.key = ioMsg.key
    const openers = openersMap.get(ioMsg.key)
    if (openers !== undefined) {
      openers.add(channel)
      channel.send(IOJsonString.msgFirst(false))
    } else {
      const setOfOpeners = new Set()
      setOfOpeners.add(channel)
      openersMap.set(ioMsg.key, setOfOpeners)
      channel.send(IOJsonString.msgFirst(true))
    }
  }

  join (channel, ioMsg) {
    const opener = this.selectOpener(ioMsg.key)
    if (opener !== undefined) {
      opener.pipe(channel)
      channel.pipe(opener)
      channel.send(IOJsonString.msgFirst(false))
    } else {
      channel.send(IOJsonString.msgFirst(true))
    }
  }

  clean (channel) {
    if (channel.key !== undefined) {
      const setOfOpeners = openersMap.get(channel.key)
      setOfOpeners.delete(channel)
      if (setOfOpeners.size === 0) {
        openersMap.delete(channel.key)
      }
    }
  }

  selectOpener (key) {
    const openers = openersMap.get(key)
    if (openers === undefined) {
      return undefined
    }
    return openers.values().next().value
  }
}
