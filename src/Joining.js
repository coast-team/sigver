export default class Joining {
  constructor (source, opener, id) {
    this.source = source
    this.source.$joining = this
    this.opener = opener
    this.id = id
    this._opened = true
    this.source.onclose = closeEvt => {
      this._opened = false
      if (this.opener) {
        this.opener.deleteJoining(this)
      }
    }
  }

  get opened () {
    if ('readyState' in this.source && 'OPEN' in this.source) {
      return this.source.readyState === this.source.OPEN
    } else {
      return this._opened
    }
  }
}
