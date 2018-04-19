import { filter, pluck } from 'rxjs/operators'
import { Subject } from 'rxjs/Subject'
import { Subscription } from 'rxjs/Subscription'

import { Group } from './Group'
import { IMessage, Message } from './proto/index'
import { ERR_HEARTBEAT, ERR_MESSAGE } from './SigError'

const MAXIMUM_MISSED_HEARTBEAT = 3
const HEARTBEAT_INTERVAL = 5000
const ID_MAX_VALUE = 4294967295
const generatedIds = new Set()

function generateId(): number {
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

export class Peer extends Subject<Message> {
  readonly key: string
  public id: number
  public group: Group | undefined
  public triedMembers: number[]
  public missedHeartbeat: number

  private heartbeatInterval: NodeJS.Timer
  private subToMember: Subscription | undefined
  private subToJoining: Subscription | undefined

  private _send: (msg: IMessage) => void
  private _close: (code: number, reason: string) => void
  private _sendFirstTrue: () => void
  private _sendFirstFalse: () => void

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
    this.id = generateId()

    // Set methods
    this._send = (msg: IMessage) => sendFunc(Message.encode(Message.create(msg)).finish())
    this._close = (code, reason) => closeFunc(code, reason)
    this._sendFirstTrue = () => sendFunc(firstTrueMsg)
    this._sendFirstFalse = () => sendFunc(firstFalseMsg)

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
    this._send(msg)
  }

  close(code: number, reason: string) {
    this._close(code, reason)
  }

  sendFirstTrue() {
    this._sendFirstTrue()
  }

  sendFirstFalse() {
    this._sendFirstFalse()
  }

  onMessage(bytes: ArrayBuffer) {
    try {
      this.next(Message.decode(new Uint8Array(bytes)))
    } catch (err) {
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
    this.id = generateId()
    this.triedMembers.push(member.id)

    // Joining subscribes to the group member.
    this.subToMember = member
      .pipe(filter(({ content }: Message) => !!content && content.id === this.id), pluck('content'))
      .subscribe(
        ({ data }: any) => {
          this.send({ content: { id: 1, data } })
          if (!!data && this.subToMember) {
            this.subToMember.unsubscribe()
          }
        },
        () => this.send({ content: { id: 1 } }),
        () => this.send({ content: { id: 1 } })
      )

    // Groum member subscribes to the joining peer.
    this.subToJoining = this.pipe(
      filter((msg) => msg.type === 'content'),
      pluck('content')
    ).subscribe(
      ({ data }: any) => {
        member.send({ content: { id: this.id, data } })
        if (!!data && this.subToJoining) {
          this.subToJoining.unsubscribe()
        }
      },
      () => member.send({ content: { id: this.id } }),
      () => member.send({ content: { id: this.id } })
    )
  }
}
