import { filter, pluck } from 'rxjs/operators'
import { ReplaySubject } from 'rxjs/ReplaySubject'

import { SigError, ERR_HEARTBEAT, ERR_MESSAGE } from './SigError'

const MAXIMUM_MISSED_HEARTBEAT = 3
const HEARTBEAT_INTERVAL = 5000
const ID_MAX_VALUE = 4294967295

export class Peer extends ReplaySubject {
  constructor (key) {
    super()
    this.key = key
    this.id = 1 + Math.ceil(Math.random() * ID_MAX_VALUE)
    this.network = undefined
    this.heartbeatInterval = undefined
    this.missedHeartbeat = 0
    this.triedMembers = []
  }

  clean () {
    clearInterval(this.heartbeatInterval)
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
        this.error(new SigError(ERR_HEARTBEAT))
      }
      this.heartbeat()
    }, HEARTBEAT_INTERVAL)
  }

  bindWith (member) {
    this.triedMembers.push(member.id)
    this.joiningToMember(member)
    this.memberToJoining(member)
  }

  /**
   * Joining subscribes to the network member.
   * @param  {Peer} member a member of the network
   */
  joiningToMember (member) {
    let isEnd = false
    const sub = member.pipe(
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
            sub.unsubscribe()
            // decline member rating
            break
          case 'isEnd':
            isEnd = true
            this.send({ content: { id: 0, isEnd } })
            sub.unsubscribe()
            break
          default: {
            const err = new SigError(
              ERR_MESSAGE,
              `Unknown message type "${msg.type}" from a network member`
            )
            log.error(err)
            member.close(err.code, err.message)
            sub.unsubscribe()
          }
        }
      },
      () => {
        if (!isEnd) {
          this.send({ content: { id: 0, isError: true } })
        }
      },
      () => {
        if (!isEnd) {
          this.send({ content: { id: 0, isError: true } })
        }
      }
    )
  }

  /**
   * Network member subscribes to the joining peer.
   * @param  {Peer} member a member of the network
   */
  memberToJoining (member) {
    let isEnd = false
    const sub = this.pipe(
      filter((msg) => msg.type === 'content'),
      pluck('content')
    ).subscribe(
      (msg) => {
        switch (msg.type) {
          case 'data':
            member.send({ content: { id: this.id, data: msg.data } })
            break
          case 'isError':
            member.send({ content: { id: this.id, isError: true } })
            sub.unsubscribe()
            // decline member rating
            break
          case 'isEnd':
            isEnd = true
            member.send({ content: { id: this.id, isEnd: true } })
            sub.unsubscribe()
            break
          default: {
            const err = new SigError(
              ERR_MESSAGE,
              `Unknown message type "${msg.type}" from the ${this.id} joining peer`
            )
            log.error(err)
            this.close(err.code, err.message)
            sub.unsubscribe()
          }
        }
      },
      () => {
        if (!isEnd) {
          member.send({ content: { id: this.id, isError: true } })
        }
      },
      () => {
        if (!isEnd) {
          member.send({ content: { id: this.id, isError: true } })
        }
      }
    )
  }
}
