export default class Joining {
  constructor (source, opener, id) {
    this.source = source
    this.source.$joining = this
    this.opener = opener
    this.id = id

    if (source.constructor.name !== 'ServerResponse') {
      this.source.onclose = closeEvt => this.close()
    }
  }

  get opened () {
    if (this.source.constructor.name !== 'ServerResponse') {
      return this.source.readyState === this.source.OPEN
    }
    return true
  }

  close () {
    if (this.opener) {
      this.opener.deleteJoining(this)
    }
  }
}
