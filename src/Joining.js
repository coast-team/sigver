export default class Joining {
  constructor (source, opener, id) {
    this.source = source
    this.source.$joining = this
    this.opener = opener
    this.id = id
    this.onclose = () => {}

    this.source.on('close', closeEvt => {
      this.onclose()
      this.opener.deleteJoining(this)
    })
  }
}
