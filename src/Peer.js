import { filter, pluck } from 'rxjs/operators'
import { Subject } from 'rxjs/Subject'

import { SigError, ERR_HEARTBEAT, ERR_MESSAGE } from './SigError'
import { Message } from './Protobuf'

const MAXIMUM_MISSED_HEARTBEAT = 3
const HEARTBEAT_INTERVAL = 5000
const ID_MAX_VALUE = 4294967295
const generatedIds = new Set()

function generateId () {
  const id = 1 + Math.ceil(Math.random() * ID_MAX_VALUE)
  if (generatedIds.has(id)) {
    return generateId()
  }
  return id
}

// Preconstructed messages for optimisation
const heartBeatMsg = Message.encode(Message.create({ heartbeat: true })).finish()
const firstTrueMsg = Message.encode(Message.create({ isFirst: true })).finish()
const firstFalseMsg = Message.encode(Message.create({ isFirst: false })).finish()

export class Peer extends Subject {
  constructor (key, sendFunc, closeFunc, heartbeatFunc) {
    super()
    this.key = key
    this.id = undefined
    this.group = undefined
    this.heartbeatInterval = undefined
    this.missedHeartbeat = 0
    this.triedMembers = []
    this.subToMember = undefined
    this.subToJoining = undefined

    // Set methods
    this.send = (msg) => sendFunc(Message.encode(Message.create(msg)).finish())
    this.close = (code, reason) => closeFunc(code, reason)
    this.sendFirstTrue = () => sendFunc(firstTrueMsg)
    this.sendFirstFalse = () => sendFunc(firstFalseMsg)

    // Start heartbeat interval
    this.missedHeartbeat = 0
    this.heartbeatInterval = setInterval(() => {
      this.missedHeartbeat++
      if (this.missedHeartbeat >= MAXIMUM_MISSED_HEARTBEAT) {
        clearInterval(this.heartbeatInterval)
        this.error(new SigError(ERR_HEARTBEAT))
      }
      heartbeatFunc(heartBeatMsg)
    }, HEARTBEAT_INTERVAL)
  }

  onMessage (bytes) {
    try {
      this.next(Message.decode(new Uint8Array(bytes)))
    } catch (err) {
      this.close(ERR_MESSAGE, err.message)
    }
  }

  onClose (code, reason) {
    clearInterval(this.heartbeatInterval)
    if (this.group !== undefined) {
      this.group.removeMember(this)
    }
    this.complete()
    generatedIds.delete(this.id)
    if (code !== 1000) {
      log.info('Connection with peer has closed', { key: this.key, id: this.id, code, reason })
    }
  }

  bindWith (member) {
    if (this.subToMember) {
      this.subToMember.unsubscribe()
    }
    if (this.subToJoining) {
      this.subToJoining.unsubscribe()
    }
    this.id = generateId()
    this.triedMembers.push(member.id)
    this.joiningToMember(member)
    this.memberToJoining(member)
  }

  /**
   * Joining subscribes to the group member.
   * @param  {Peer} member a member of the group
   */
  joiningToMember (member) {
    let isEnd = false
    this.subToMember = member.pipe(
      filter((msg) => msg.type === 'content' && msg.content.id === this.id),
      pluck('content')
    ).subscribe(
      (msg) => {
        switch (msg.type) {
          case 'data':
            this.send({ content: { id: 0, data: msg.data } })
            break
          case 'isError':
            this.send({ content: { id: 0, isError: true } })
            this.subToMember.unsubscribe()
            this.subToJoining.unsubscribe()
            // decline member rating
            break
          case 'isEnd':
            isEnd = true
            this.send({ content: { id: 0, isEnd } })
            this.subToMember.unsubscribe()
            break
          default: {
            const err = new SigError(
              ERR_MESSAGE,
              `Unknown message type "${msg.type}" from a group member`
            )
            log.error(err)
            member.close(err.code, err.message)
            this.subToMember.unsubscribe()
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
   * @param  {Peer} member a member of the group
   */
  memberToJoining (member) {
    let isEnd = false
    this.subToJoining = this.pipe(
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
            this.subToJoining.unsubscribe()
            this.subToMember.unsubscribe()
            // decline member rating
            break
          case 'isEnd':
            isEnd = true
            member.send({ content: { id: this.id, isEnd: true } })
            this.subToJoining.unsubscribe()
            break
          default: {
            const err = new SigError(
              ERR_MESSAGE,
              `Unknown message type "${msg.type}" from the ${this.id} joining peer`
            )
            log.error(err)
            this.close(err.code, err.message)
            this.subToJoining.unsubscribe()
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
