import SigverError from './SigverError'

const PING_INTERVAL = 5000
const ID_MAX_VALUE = 4294967295

export default class Peer extends require('rxjs/Rx').Subject {
  constructor (key) {
    super()
    this.key = key
    this.id = 1 + Math.ceil(Math.random() * ID_MAX_VALUE)
    this.network = undefined
    this.pongTimeout = undefined
    this.pongReceived = false
  }

  clean () {
    if (this.pongTimeout !== undefined) {
      clearTimeout(this.pongTimeout)
    }
    if (this.network !== undefined) {
      this.network.removeMember(this)
    }
  }

  startPing () {
    this.pongReceived = false
    this.send({ ping: true })
    this.pongTimeout = setTimeout(() => {
      if (!this.pongReceived) {
        this.pongTimeout = undefined
        this.error(new SigverError(SigverError.PONG_TIMEOUT_ERROR))
      } else {
        this.startPing()
      }
    }, PING_INTERVAL)
  }

  connect (member) {
    // Joining subscribes to network member
    let memberEnded = false
    const subToMember = member
      .filter(msg => msg.type === 'content' && msg.content.id === this.id)
      .map(({ content }) => content)
      .subscribe(
        content => {
          this.send({ content: Object.assign(content, { id: 0 }) })
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
          member.send({ content: Object.assign(content, { id: this.id }) })
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
