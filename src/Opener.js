import Joining from './Joining'

const MAX_ID = 2147483647 // int32 max value for id generation

export default class Opener {
  constructor (source) {
    this.source = source
    this.source.$opener = this
    this.joinings = new Map()
    this.onclose = () => {}

    this.source.on('close', closeEvt => {
      this.onclose()
      this.joinings.forEach(j => {
        j.opener = undefined
        j.source.close(4008, 'Opener is no longer available')
      })
    })
  }

  getJoining (id) {
    for (let i of this.joinings) {
      console.log('Joining: ' + i[0])
    }
    return this.joinings.get(id)
  }

  addJoining (source) {
    const id = this.generateId()
    this.joinings.set(id, new Joining(source, this, id))
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
