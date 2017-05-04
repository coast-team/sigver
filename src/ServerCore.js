import IOJsonString from './IOJsonString'
import log from './log'

const openersByKey = new Map()

/**
 * The core of the signaling server (WebSocket and SSE) containing the main logic
 */
export default class ServerCore {
  init (channel) {
    channel.subscribe(
      ioMsg => {
        if (ioMsg.isToOpen()) {
          log.info(channel.id + ' message OPEN: ')
          this.open(channel, ioMsg)
        } else if (ioMsg.isToJoin()) {
          log.info(channel.id + ' message JOIN: ')
          this.join(channel, ioMsg)
        } else if (ioMsg.isPing()) {
          log.info(channel.id + ' message PING: ')
          channel.send(IOJsonString.msgPong())
        } else if (ioMsg.isPong()) {
          log.info(channel.id + ' message PONG: ')
          channel.pongReceived = true
        }
      },
      err => {
        log.error('ServerCore', { id: channel.id, isOpener: channel.key !== undefined, err })
        this.clean(channel)
      },
      () => this.clean(channel)
    )
    channel.startPing()
  }

  open (channel, ioMsg) {
    channel.init(ioMsg.key)
    let openers = openersByKey.get(ioMsg.key)
    if (openers !== undefined) {
      openers.add(channel)
    } else {
      openers = new Set()
      openers.add(channel)
      openersByKey.set(ioMsg.key, openers)
    }
    log.info('ADD Opener', {op: 'add', id: channel.id, key: channel.key, size: openers.size})
    channel.send(IOJsonString.msgFirst(true))
  }

  join (channel, ioMsg) {
    const opener = this.selectOpener(ioMsg.key)
    if (opener !== undefined) {
      channel.connect(opener)
      channel.send(IOJsonString.msgFirst(false))
    } else {
      channel.send(IOJsonString.msgFirst(true))
    }
  }

  clean (channel) {
    channel.stopPing()
    if (channel.key !== undefined) {
      const openers = openersByKey.get(channel.key)
      let size
      if (openers.size === 1) {
        openersByKey.delete(channel.key)
        size = 0
      } else {
        openers.delete(channel)
        size = openers.size
      }
      log.info('DELETE Opener', {op: 'delete', id: channel.id, key: channel.key, size})
    }
  }

  selectOpener (key) {
    const openers = openersByKey.get(key)
    if (openers === undefined) {
      return undefined
    }
    return openers.values().next().value
  }
}
