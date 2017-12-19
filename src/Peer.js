import { filter, pluck } from 'rxjs/operators'
import { ReplaySubject } from 'rxjs/ReplaySubject'

import SigverError from './SigverError'

const MAXIMUM_MISSED_HEARTBEAT = 3
const HEARTBEAT_INTERVAL = 5000
const ID_MAX_VALUE = 4294967295

export default class Peer extends ReplaySubject {
  constructor (key) {
    super()
    this.key = key
    this.id = 1 + Math.ceil(Math.random() * ID_MAX_VALUE)
    this.network = undefined
    this.heartbeatInterval = undefined
    this.missedHeartbeat = 0
  }

  clean () {
    clearTimeout(this.heartbeatInterval)
    if (this.network !== undefined) {
      this.network.removeMember(this)
    }
  }

  startHeartbeat () {
    this.missedHeartbeat = 0
    this.heartbeatInterval = setInterval(() => {
      this.missedHeartbeat++
      if (this.missedHeartbeat >= MAXIMUM_MISSED_HEARTBEAT) {
        clearInterval(this.heartbeatInterval)
        this.error(new SigverError(SigverError.HEARTBEAT_ERROR_CODE))
      }
      this.heartbeat()
    }, HEARTBEAT_INTERVAL)
  }

  connect (member) {
    // Joining subscribes to network member
    let memberEnded = false
    const memberSub = member.pipe(
      filter((msg) => msg.type === 'content' && msg.content.id === this.id),
      pluck('content')
    ).subscribe(
      (msg) => {
        log.debug('Message from Member: ', msg.type)
        switch (msg.type) {
          case 'data':
            this.send({ content: { id: 0, data: msg.data } })
            break
          case 'isError':
            this.send({ content: { id: 0, isError: true } })
            memberSub.unsubscribe()
            // decline member rating
            break
          case 'isEnd':
            memberEnded = true
            this.send({ content: { id: 0, isEnd: true } })
            memberSub.unsubscribe()
            break
          default:
            log.error(new Error('Unknown message from a network member'))
            member.close()
            memberSub.unsubscribe()
        }
      },
      () => {
        if (!memberEnded) {
          this.send({ content: { id: 0, isError: true } })
        }
      },
      () => {
        if (!memberEnded) {
          this.send({ content: { id: 0, isError: true } })
        }
      }
    )

    // Network member subscribes to Joining
    let joiningEnded = false
    const thisSub = this.pipe(
      filter((msg) => msg.type === 'content'),
      pluck('content')
    ).subscribe(
      (msg) => {
        log.debug('Message from Joining: ', msg.type)
        switch (msg.type) {
          case 'data':
            member.send({ content: { id: this.id, data: msg.data } })
            break
          case 'isError':
            member.send({ content: { id: this.id, isError: true } })
            thisSub.unsubscribe()
            // decline member rating
            break
          case 'isEnd':
            joiningEnded = true
            member.send({ content: { id: this.id, isEnd: true } })
            thisSub.unsubscribe()
            break
          default:
            log.error(new Error('Unknown message from a joining peer'))
            this.close()
            memberSub.unsubscribe()
        }
      },
      () => {
        if (!joiningEnded) {
          member.send({ content: { id: this.id, isError: true } })
        }
      },
      () => {
        if (!joiningEnded) {
          member.send({ content: { id: this.id, isError: true } })
        }
      }
    )
  }
}
