import Joining from './Joining'

const MAX_ID = 2147483647 // int32 max value for id generation

export default class Opener {
  constructor (source) {
    this.source = source
    this.source.$opener = this
    this.joinings = new Map()
    this.onclose = () => {}

    this.source.onclose = closeEvt => {
      this.onclose()
      this.joinings.forEach(j => { j.opener = undefined })
    }
  }

  getJoining (id) {
    return this.joinings.get(id)
  }

  addJoining (source) {
    const id = this.generateId()
    const joining = new Joining(source, this, id)
    this.joinings.set(id, joining)
  }

  deleteJoining (joining) {
    this.joinings.delete(joining.id)
  }

  generateId () {
    let id
    do {
      id = Math.ceil(Math.random() * MAX_ID)
      if (this.joinings.has(id)) continue
      break
    } while (true)
    return id
  }
}
