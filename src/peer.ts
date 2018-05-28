import { Subject, Subscription } from 'rxjs'
import { filter, pluck } from 'rxjs/operators'

import { Group, isAGroupMember } from './groups'
import { GroupData, IMessage, Message } from './proto'
import { ERR_HEARTBEAT, ERR_MESSAGE, generateId } from './util'

const MAXIMUM_MISSED_HEARTBEAT = 3
const HEARTBEAT_INTERVAL = 5000

const generatedIds = new Set()

// Preconstructed messages for optimisation
const heartBeatMsg = Message.encode(Message.create({ heartbeat: true })).finish()
const connectedTrueMsg = Message.encode(Message.create({ connected: true })).finish()
const connectedFalseMsg = Message.encode(Message.create({ connected: false })).finish()

export class Peer extends Subject<Message> {
  public id: number
  public group: Group | undefined
  public triedMembers: number[]
  public favored: boolean

  private joiningId: number
  private heartbeatInterval: NodeJS.Timer
  private subToMember: Subscription | undefined
  private subToJoining: Subscription | undefined
  private sendFunc: (msg: Uint8Array) => void
  private closeFunc: (code: number, reason: string) => void

  constructor(
    key: string,
    favored: boolean,
    sendFunc: (msg: Uint8Array) => void,
    closeFunc: (code: number, reason: string) => void
  ) {
    super()
    this.favored = favored
    this.triedMembers = []
    this.joiningId = generateId(generatedIds)
    this.id = this.joiningId
    this.closeFunc = closeFunc
    this.sendFunc = sendFunc

    // Handle all incoming messages for this peer, but content which is handled in bindWith method.
    this.subscribe((msg: Message) => {
      if (!msg.type) {
        this.close(ERR_MESSAGE, 'Wrong message format or unknown message')
      }
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

  onMessage(bytes: ArrayBuffer) {
    try {
      this.next(Message.decode(new Uint8Array(bytes)))
    } catch (err) {
      log.error('Message error: ', err)
      this.close(ERR_MESSAGE, err.message)
    }
  }

  onClose() {
    clearInterval(this.heartbeatInterval)
    if (this.group !== undefined) {
      this.group.removeMember(this)
    }
    this.complete()
    generatedIds.delete(this.joiningId)
  }

  bindWith(member: Peer) {
    if (this.subToMember) {
      this.subToMember.unsubscribe()
    }
    if (this.subToJoining) {
      this.subToJoining.unsubscribe()
    }
    this.joiningId = generateId(generatedIds)
    this.triedMembers.push(member.id)

    // Joining subscribes to the group member.
    this.subToMember = member
      .pipe(
        filter(({ content }) => !!content && content.id === this.joiningId),
        pluck('content')
      )
      .subscribe(
        ({ lastData, data }: any) => {
          this.send({ content: { id: 1, data } })
          if (lastData) {
            ;(this.subToMember as Subscription).unsubscribe()
          }
        },
        () => this.send({ content: { id: 1 } }),
        () => this.send({ content: { id: 1 } })
      )

    // Group member subscribes to the joining peer.
    this.subToJoining = this.pipe(
      filter(({ content }) => !!content),
      pluck('content')
    ).subscribe(
      ({ lastData, data }: any) => {
        member.send({ content: { id: this.joiningId, data } })
        if (lastData) {
          ;(this.subToJoining as Subscription).unsubscribe()
        }
      },
      () => member.send({ content: { id: this.joiningId } }),
      () => member.send({ content: { id: this.joiningId } })
    )
  }
}
