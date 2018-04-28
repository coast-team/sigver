import { Subject, Subscription } from 'rxjs'
import { filter, pluck } from 'rxjs/operators'

import { Group } from './Group'
import { IMessage, Message } from './proto/index'
import { ERR_HEARTBEAT, ERR_MESSAGE, generateId } from './Util'

const MAXIMUM_MISSED_HEARTBEAT = 3
const HEARTBEAT_INTERVAL = 5000

const generatedIds = new Set()

// Preconstructed messages for optimisation
const heartBeatMsg = Message.encode(Message.create({ heartbeat: true })).finish()
const connectedTrueMsg = Message.encode(Message.create({ connected: true })).finish()
const connectedFalseMsg = Message.encode(Message.create({ connected: false })).finish()

export class Peer extends Subject<Message> {
  readonly key: string
  public id: number
  public group: Group | undefined
  public triedMembers: number[]
  public missedHeartbeat: number

  private heartbeatInterval: NodeJS.Timer
  private subToMember: Subscription | undefined
  private subToJoining: Subscription | undefined
  private sendFunc: (msg: Uint8Array) => void
  private closeFunc: (code: number, reason: string) => void

  constructor(
    key: string,
    sendFunc: (msg: Uint8Array) => void,
    closeFunc: (code: number, reason: string) => void,
    heartbeatFunc: (msg: Uint8Array) => void
  ) {
    super()
    this.key = key
    this.missedHeartbeat = 0
    this.triedMembers = []
    this.id = generateId(generatedIds)
    this.closeFunc = closeFunc
    this.sendFunc = sendFunc

    // Start heartbeat interval
    this.missedHeartbeat = 0
    this.heartbeatInterval = setInterval(() => {
      this.missedHeartbeat++
      if (this.missedHeartbeat >= MAXIMUM_MISSED_HEARTBEAT) {
        clearInterval(this.heartbeatInterval)
        this.close(ERR_HEARTBEAT, 'Too many missed hearbeats')
      }
      heartbeatFunc(heartBeatMsg)
    }, HEARTBEAT_INTERVAL)
  }

  send(msg: IMessage) {
    this.sendFunc(Message.encode(Message.create(msg)).finish())
  }

  close(code: number, reason: string) {
    this.closeFunc(code, reason)
  }

  sendConnectedTrue() {
    this.sendFunc(connectedTrueMsg)
  }

  sendConnectedFalse() {
    this.sendFunc(connectedFalseMsg)
  }

  onMessage(bytes: ArrayBuffer) {
    try {
      this.next(Message.decode(new Uint8Array(bytes)))
    } catch (err) {
      log.error(err)
      this.close(ERR_MESSAGE, err.message)
    }
  }

  onClose(code: number, reason: string) {
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

  bindWith(member: Peer) {
    if (this.subToMember) {
      this.subToMember.unsubscribe()
    }
    if (this.subToJoining) {
      this.subToJoining.unsubscribe()
    }
    this.id = generateId(generatedIds)
    this.triedMembers.push(member.id)

    // Joining subscribes to the group member.
    this.subToMember = member
      .pipe(filter(({ content }) => !!content && content.id === this.id), pluck('content'))
      .subscribe(
        ({ unsubscribe, data }: any) => {
          this.send({ content: { id: 1, data } })
          if (unsubscribe && this.subToMember) {
            this.subToMember.unsubscribe()
          }
        },
        () => this.send({ content: { id: 1 } }),
        () => this.send({ content: { id: 1 } })
      )

    // Group member subscribes to the joining peer.
    this.subToJoining = this.pipe(filter(({ content }) => !!content), pluck('content')).subscribe(
      ({ unsubscribe, data }: any) => {
        member.send({ content: { id: this.id, data } })
        if (unsubscribe && this.subToJoining) {
          this.subToJoining.unsubscribe()
        }
      },
      () => member.send({ content: { id: this.id } }),
      () => member.send({ content: { id: this.id } })
    )
  }
}
