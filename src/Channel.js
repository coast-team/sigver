import IOJsonString from './IOJsonString'
import SigverError from './SigverError'
import log from './log'

const PING_INTERVAL = 5000
const shortid = require('shortid')

export default class Channel extends require('rxjs/Rx').Subject {
  constructor () {
    super()
    this.id = shortid.generate()
    this.subscriptionToOpener = undefined
    this.key = undefined
    this.send = undefined
    this.timeout = undefined
    this.pongReceived = false
  }

  init (key) {
    this.key = key
    if (this.subscriptionToOpener) {
      this.subscriptionToOpener.unsubscribe()
      this.subscriptionToOpener = undefined
    }
  }

  startPing () {
    this.send(IOJsonString.msgPing())
    const timeout = setInterval(() => {
      if (!this.pongReceived) {
        this.error(new SigverError(SigverError.PING_ERROR))
        clearInterval(timeout)
      } else {
        this.pongReceived = false
        this.send(IOJsonString.msgPing())
      }
    }, PING_INTERVAL)
  }

  stopPing () {
    if (this.timeout !== undefined) {
      clearInterval(this.timeout)
    }
  }

  pipe (channel) {
    if (this.key === undefined) {
      this.subscriptionToOpener = channel.filter(ioMsg => ioMsg.isToTransmit() && ioMsg.id === this.id)
        .subscribe(
          ioMsg => this.send(ioMsg.msgTransmit()),
          err => {
            log.error('Channel', { id: this.id, isOpener: false, subscribedToId: channel.id, err: err.message })
            this.send(IOJsonString.msgUnavailable(channel.id))
          },
          () => this.send(IOJsonString.msgUnavailable(channel.id))
        )
    } else {
      channel.filter(ioMsg => ioMsg.isToTransmit())
        .subscribe(
          ioMsg => this.send(ioMsg.msgTransmit(channel.id)),
          err => {
            log.error('Channel', { id: this.id, isOpener: true, subscribedToId: channel.id, err: err.message })
            if (err.code && err.code === SigverError.RESPONSE_TIMEOUT_ERROR) {
              this.error(err)
            } else {
              this.send(IOJsonString.msgUnavailable(channel.id))
            }
          },
          () => this.send(IOJsonString.msgUnavailable(channel.id))
        )
    }
  }
}
