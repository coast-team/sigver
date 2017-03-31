const shortid = require('shortid')

import IOJsonString from './IOJsonString'

export default class Channel extends require('rxjs/Rx').Subject {
  constructor () {
    super()
    this.id = shortid.generate()
    this.key = undefined
    this.send = undefined
  }

  pipe (channel) {
    if (this.key === undefined) {
      channel.filter(ioMsg => ioMsg.isToTransmit() && ioMsg.id === this.id)
        .subscribe(
          ioMsg => this.send(ioMsg.msgTransmit()),
          err => {
            console.log('Channel Opener: ' + err.message)
            this.send(IOJsonString.msgUnavailable(channel.id))
          }
        )
    } else {
      channel.filter(ioMsg => ioMsg.isToTransmit())
        .subscribe(
          ioMsg => this.send(ioMsg.msgTransmit(channel.id)),
          err => {
            console.log('Channel Joining: ' + err.message)
            this.send(IOJsonString.msgUnavailable(channel.id))
          }
        )
    }
  }
}
