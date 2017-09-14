import SigverError from './SigverError'

const PING_TIMEOUT = 5000
const ID_MAX_VALUE = 4294967295

export default class Peer extends require('rxjs/Rx').ReplaySubject {
  constructor (key) {
    super()
    this.key = key
    this.id = 1 + Math.ceil(Math.random() * ID_MAX_VALUE)
    this.network = undefined
    this.pingTimer = undefined
    this.pongReceived = false
  }

  clean () {
    clearTimeout(this.pingTimer)
    if (this.network !== undefined) {
      this.network.removeMember(this)
    }
    this.close(SigverError.PONG_TIMEOUT_ERROR, `Signaling: pong not received in ${PING_TIMEOUT} milliseconds`)
  }

  startPing () {
    this.pongReceived = false
    this.send({ ping: true })
    this.pingTimer = setTimeout(() => {
      if (!this.pongReceived) {
        this.error(new SigverError(SigverError.PONG_TIMEOUT_ERROR))
      } else {
        this.startPing()
      }
    }, PING_TIMEOUT)
  }

  connect (member) {
    // Joining subscribes to network member
    let memberEnded = false
    const subToMember = member
      .filter(msg => msg.type === 'content' && msg.content.id === this.id)
      .map(({ content }) => content)
      .subscribe(
        content => {
          this.send({ content: { id: 0, data: content.data } })
          if (content.isEnd) {
            memberEnded = true
            subToMember.unsubscribe()
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
    const subToJoining = this
      .filter(({ type }) => type === 'content')
      .map(({ content }) => content)
      .subscribe(
        content => {
          member.send({ content: { id: this.id, data: content.data } })
          if (content.isEnd) {
            joiningEnded = true
            subToJoining.unsubscribe()
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
