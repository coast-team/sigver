import { Subject, Subscription } from 'rxjs'
import { filter, map } from 'rxjs/operators'

import { Group, isAGroupMember } from './groups.js'
import { dismissId, generateId } from './id-generator.js'
import { GroupData, type IMessage, Message } from './proto/index.js'
import { ERR_HEARTBEAT, ERR_MESSAGE } from './sig-error.js'

const MAXIMUM_MISSED_HEARTBEAT = 3
const HEARTBEAT_INTERVAL = 5000

// Preconstructed messages for optimization
const heartBeatMsg = Message.encode({ heartbeat: true }).finish()
const connectedTrueMsg = Message.encode({ connected: true }).finish()
const connectedFalseMsg = Message.encode({ connected: false }).finish()

export class Peer {
  declare netfluxId: number | undefined
  declare group: Group | undefined
  declare triedMembers: number[]
  declare readonly favored: boolean
  declare readonly msgs: Subject<Message>

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
    this.favored = favored
    this.triedMembers = []
    this.netfluxId = undefined
    this.signalingId = generateId()
    this.closeFunc = closeFunc
    this.sendFunc = sendFunc
    this.msgs = new Subject()

    // Handle all incoming messages for this peer, but content which is handled in bindWith method.
    this.msgs.subscribe((msg: Message) => {
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
        this.close(ERR_HEARTBEAT, 'Too many missed heartbeats')
      }
      sendFunc(heartBeatMsg)
    }, HEARTBEAT_INTERVAL)
  }

  send(msg: IMessage): void {
    this.sendFunc(Message.encode(msg).finish())
  }

  close(code: number, reason: string): void {
    this.closeFunc(code, reason)
  }

  onMessage(bytes: Uint8Array): void {
    try {
      this.msgs.next(Message.decode(bytes))
    } catch (err) {
      this.close(ERR_MESSAGE, err.message)
    }
  }

  becomeMember(group: Group, id: number): void {
    this.group = group
    this.triedMembers = []
    this.netfluxId = id
  }

  noLongerAMember(): void {
    this.group = undefined
    this.netfluxId = undefined
  }

  onClose(): void {
    clearInterval(this.heartbeatInterval)
    if (this.group !== undefined) {
      this.group.removeMember(this)
    }
    this.msgs.complete()
    dismissId(this.signalingId)
  }

  bindWith(member: Peer): void {
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
    this.subToMember = member.msgs
      .pipe(
        filter(({ content }) => content != null && content.recipientId === this.signalingId),
        map((x) => x.content)
      )
      .subscribe({
        next: ({ lastData, data }: any) => {
          this.send({ content: { recipientId: this.signalingId, senderId: 0, data } })
          if (lastData) {
            ;(this.subToMember as Subscription).unsubscribe()
          }
        },
        error: () => this.send({ content: { recipientId: this.signalingId, senderId: 0 } }),
        complete: () => this.send({ content: { recipientId: this.signalingId, senderId: 0 } }),
      })

    // Group member subscribes to the joining peer.
    this.subToJoining = this.msgs
      .pipe(
        filter(({ content }) => content != null),
        map((x) => x.content)
      )
      .subscribe({
        next: ({ lastData, data }: any) => {
          member.send({ content: { recipientId: 0, senderId: this.signalingId, data } })
          if (lastData) {
            ;(this.subToJoining as Subscription).unsubscribe()
          }
        },
        error: () => member.send({ content: { recipientId: 0, senderId: this.signalingId } }),
        complete: () => member.send({ content: { recipientId: 0, senderId: this.signalingId } }),
      })
  }
}
