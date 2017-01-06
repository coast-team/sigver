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

  close () {
    if (this.opener) {
      this.opener.deleteJoining(this)
    }
  }
}
