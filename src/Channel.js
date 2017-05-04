import IOJsonString from './IOJsonString'
import SigverError from './SigverError'
import log from './log'

const PING_INTERVAL = 5000
const shortid = require('shortid')

export default class Channel extends require('rxjs/Rx').Subject {
  constructor () {
    super()
    this.id = shortid.generate()
    this.subscriptions = []
    this.key = undefined
    this.send = undefined
    this.timeout = undefined
    this.pongReceived = false
  }

  init (key) {
    this.key = key
    if (this.subscriptions.length !== 0) {
      this.subscriptions.forEach(s => s.unsubscribe())
      this.subscriptions = []
    }
  }

  startPing () {
    this.send(IOJsonString.msgPing())
    this.timeout = setInterval(() => {
      if (!this.pongReceived) {
        this.timeout = undefined
        this.error(new SigverError(SigverError.PING_ERROR))
      } else {
        this.pongReceived = false
        this.startPing()
      }
    }, PING_INTERVAL)
  }

  stopPing () {
    if (this.timeout !== undefined) {
      clearInterval(this.timeout)
    }
  }

  connect (channel) {
    // Joining subscribes to Opener
    let subs = channel.filter(ioMsg => ioMsg.isToTransmit() && ioMsg.id === this.id)
      .subscribe(
        ioMsg => this.send(ioMsg.msgTransmit()),
        err => {
          log.error('Channel', { id: this.id, isOpener: false, subscribedToId: channel.id, err: err.message })
          this.send(IOJsonString.msgUnavailable(channel.id))
        },
        () => this.send(IOJsonString.msgUnavailable(channel.id))
      )

    this.subscriptions[this.subscriptions.length] = subs

    // Opener subscribes to Joining
    subs = this.filter(ioMsg => ioMsg.isToTransmit())
      .subscribe(
        ioMsg => channel.send(ioMsg.msgTransmit(this.id)),
        err => {
          log.error('Channel', { id: channel.id, isOpener: true, subscribedToId: this.id, err: err.message })
          if (err.code && err.code === SigverError.RESPONSE_TIMEOUT_ERROR) {
            channel.error(err)
          } else {
            channel.send(IOJsonString.msgUnavailable(this.id))
          }
        },
        () => channel.send(IOJsonString.msgUnavailable(this.id))
      )

    this.subscriptions[this.subscriptions.length] = subs
    channel.subscriptions[channel.subscriptions.length] = subs
  }
}
