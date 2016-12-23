import IO from './IO'
import SigverError from './SigverError'

const KEY_LENGTH_LIMIT = 512

export default class IOJsonString extends IO {

  constructor (data) {
    super()
    try {
      this.msg = JSON.parse(data)
    } catch (err) {
      throw new SigverError(
        SigverError.MESSAGE_FORMAT_ERROR,
        'The message is not a JSON string'
      )
    }
    this._key = undefined
    this.open = false
    this.transmitToOpener = false
    this.join = false
    this.transmitToJoining = false
    const keysNb = Object.keys(this.msg).length
    if (('open' in this.msg) && keysNb === 1) {
      this._key = this.msg.open
      this.validateKey()
      this.open = true
    } else if ('join' in this.msg && keysNb === 1) {
      this._key = this.msg.join
      this.validateKey()
      this.join = true
    } else if ('data' in this.msg && keysNb === 1) {
      this.transmitToOpener = true
    } else if ('id' in this.msg && 'data' in this.msg && keysNb === 2) {
      if (typeof this.msg.id !== 'number') {
        throw new Error(`The id should be a number, but it is ${typeof this.msg.id} instead`)
      }
      this.transmitToJoining = true
    } else {
      throw new SigverError(SigverError.MESSAGE_UNKNOWN, 'Unknown message')
    }
  }

  isToOpen () { return this.open }

  isToJoin () { return this.join }

  isToTransmitToOpener () { return this.transmitToOpener }

  isToTransmitToJoining () { return this.transmitToJoining }

  get key () { return this._key }

  get id () { return this.msg.id }

  get data () { return this.msg.data }

  static msgIsKeyOk (isOk) {
    return `{"isKeyOk":${isOk}}`
  }

  static msgJoiningUnavailable (id) {
    return `{"id":${id},"unavailable":"true"}`
  }

  msgToJoining () {
    return `{"data":"${this.data}"}`
  }

  msgToOpener (id) {
    return `{"id":${id},"data":"${this.data}"}`
  }

  validateKey () {
    if (this.key.length > KEY_LENGTH_LIMIT) {
      throw new SigverError(
        SigverError.KEY_TOO_LONG,
        `The key length exceeds the limit of ${KEY_LENGTH_LIMIT} characters`
      )
    }
    if (typeof this._key !== 'string') {
      throw new SigverError(
        SigverError.KEY_FORMAT_ERROR,
        `The key ${this._key} is not a string`
      )
    }
    if (this._key === '') {
      throw new SigverError(
        SigverError.KEY_FORMAT_ERROR,
        `The key ${this._key} is an empty string`
      )
    }
  }

}
