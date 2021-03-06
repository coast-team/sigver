import { Subject, Subscription } from 'rxjs'
import { filter, pluck } from 'rxjs/operators'

import { Group, isAGroupMember } from './groups'
import { GroupData, IMessage, Message } from './proto/index.js'
import { dismissId, ERR_HEARTBEAT, ERR_MESSAGE, generateId } from './util'

const MAXIMUM_MISSED_HEARTBEAT = 3
const HEARTBEAT_INTERVAL = 5000

// Preconstructed messages for optimisation
const heartBeatMsg = Message.encode(Message.create({ heartbeat: true })).finish()
const connectedTrueMsg = Message.encode(Message.create({ connected: true })).finish()
const connectedFalseMsg = Message.encode(Message.create({ connected: false })).finish()

export class Peer extends Subject<Message> {
  declare netfluxId: number | undefined
  declare group: Group | undefined
  declare triedMembers: number[]
  declare readonly favored: boolean

  private declare readonly heartbeatInterval: NodeJS.Timer
  private declare subToMember: Subscription | undefined
  private declare subToJoining: Subscription | undefined
  private declare readonly sendFunc: (msg: Uint8Array) => void
  private declare readonly closeFunc: (code: number, reason: string) => void
  private declare signalingId: number

  constructor(
    key: string,
    favored: boolean,
    sendFunc: (msg: Uint8Array) => void,
    closeFunc: (code: number, reason: string) => void
  ) {
    super()
    this.favored = favored
    this.triedMembers = []
    this.netfluxId = undefined
    this.signalingId = generateId()
    this.closeFunc = closeFunc
    this.sendFunc = sendFunc

    // Handle all incoming messages for this peer, but content which is handled in bindWith method.
    this.subscribe((msg: Message) => {
      switch (msg.type) {
        case 'connect': {
          const { id, members } = msg.connect as GroupData
          if (isAGroupMember(this, id, members, key)) {
            sendFunc(connectedTrueMsg)
          } else {
            sendFunc(connectedFalseMsg)
          }
          break
        }
        case 'heartbeat':
          missedHeartbeat = 0
          break
        case undefined:
          this.close(ERR_MESSAGE, 'Wrong message format or unknown message')
          break
      }
    })

    // Start heartbeat interval
    let missedHeartbeat = 0
    this.heartbeatInterval = setInterval(() => {
      missedHeartbeat++
      if (missedHeartbeat >= MAXIMUM_MISSED_HEARTBEAT) {
        clearInterval(this.heartbeatInterval)
        this.close(ERR_HEARTBEAT, 'Too many missed hearbeats')
      }
      sendFunc(heartBeatMsg)
    }, HEARTBEAT_INTERVAL)
  }

  send(msg: IMessage) {
    this.sendFunc(Message.encode(Message.create(msg)).finish())
  }

  close(code: number, reason: string) {
    this.closeFunc(code, reason)
  }

  onMessage(bytes: Uint8Array) {
    try {
      this.next(Message.decode(bytes))
    } catch (err) {
      this.close(ERR_MESSAGE, err.message)
    }
  }

  becomeMember(group: Group, id: number) {
    this.group = group
    this.triedMembers = []
    this.netfluxId = id
  }

  noLongerAMember() {
    this.group = undefined
    this.netfluxId = undefined
  }

  onClose() {
    clearInterval(this.heartbeatInterval)
    if (this.group !== undefined) {
      this.group.removeMember(this)
    }
    this.complete()
    dismissId(this.signalingId)
  }

  bindWith(member: Peer) {
    if (this.subToMember !== undefined) {
      this.subToMember.unsubscribe()
    }
    if (this.subToJoining !== undefined) {
      this.subToJoining.unsubscribe()
    }
    dismissId(this.signalingId)
    this.signalingId = generateId()
    this.triedMembers.push(member.netfluxId as number)

    // Joining subscribes to the group member.
    this.subToMember = member
      .pipe(
        filter(({ content }) => content != null && content.recipientId === this.signalingId),
        pluck('content')
      )
      .subscribe(
        ({ lastData, data }: any) => {
          this.send({ content: { recipientId: this.signalingId, senderId: 0, data } })
          if (lastData) {
            ;(this.subToMember as Subscription).unsubscribe()
          }
        },
        () => this.send({ content: { recipientId: this.signalingId, senderId: 0 } }),
        () => this.send({ content: { recipientId: this.signalingId, senderId: 0 } })
      )

    // Group member subscribes to the joining peer.
    this.subToJoining = this.pipe(
      filter(({ content }) => content != null),
      pluck('content')
    ).subscribe(
      ({ lastData, data }: any) => {
        member.send({ content: { recipientId: 0, senderId: this.signalingId, data } })
        if (lastData) {
          ;(this.subToJoining as Subscription).unsubscribe()
        }
      },
      () => member.send({ content: { recipientId: 0, senderId: this.signalingId } }),
      () => member.send({ content: { recipientId: 0, senderId: this.signalingId } })
    )
  }
}
