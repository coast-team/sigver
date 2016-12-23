export default class Joining {
  constructor (source, opener, id) {
    this.source = source
    this.source.$joining = this
    this.opener = opener
    this.id = id

    this.source.onclose = closeEvt => {
      if (this.opener) {
        this.opener.deleteJoining(this)
      }
    }
  }
}
