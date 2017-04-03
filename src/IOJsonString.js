import SigverError from './SigverError'

const KEY_LENGTH_LIMIT = 512

/**
 * Parser of the incoming messages and Builder for the outcoming messages. It treats only
 * JSON strings, otherwise throw an error.
 */
export default class IOJsonString {
  constructor (data) {
    this.id = undefined
    this.data = undefined

    this._openKey = undefined
    this._joinKey = undefined
    this.ping = false
    this.pong = false
    let msg
    try {
      msg = JSON.parse(data)
    } catch (err) {
      throw new SigverError(SigverError.MESSAGE_ERROR, 'The message is not a JSON string')
    }
    const keysNb = Object.keys(msg).length
    if (('open' in msg) && keysNb === 1) {
      this.validateKey(msg.open)
      this._openKey = msg.open
    } else if ('join' in msg && keysNb === 1) {
      this.validateKey(msg.join)
      this._joinKey = msg.join
    } else if ('data' in msg) {
      this.data = JSON.stringify(msg.data)
      if ('id' in msg && keysNb === 2) {
        this.validateId(msg.id)
        this.id = msg.id
      } else if (keysNb !== 1) {
        throw new SigverError(SigverError.MESSAGE_ERROR, 'Unknown message: ' + data)
      }
    } else if ('ping' in msg && msg.ping && keysNb === 1) {
      this.ping = true
    } else if ('pong' in msg && msg.pong && keysNb === 1) {
      this.pong = true
    } else {
      throw new SigverError(SigverError.MESSAGE_ERROR, 'Unknown message: ' + data)
    }
  }

  isToOpen () { return this._openKey !== undefined }

  isToJoin () { return this._joinKey !== undefined }

  isToTransmit () { return this.data !== undefined }

  isPing () { return this.ping }

  isPong () { return this.pong }

  get key () { return this._openKey ? this._openKey : this._joinKey }

  static msgUnavailable (id) {
    return id ? `{"unavailable":"${id}"}` : `{"unavailable":"0"}`
  }

  static msgFirst (first) {
    return `{"first":${first}}`
  }

  static msgPing () {
    return '{"ping":true}'
  }

  static msgPong () {
    return '{"pong":true}'
  }

  msgTransmit (id) {
    return id ? `{"id":"${id}","data":${this.data}}` : `{"data":${this.data}}`
  }

  validateKey (key) {
    if (typeof key !== 'string') {
      throw new SigverError(SigverError.KEY_ERROR, `The key ${key} is not a string`)
    }
    if (key === '') {
      throw new SigverError(SigverError.KEY_ERROR, `The key ${key} is an empty string`)
    }
    if (key.length > KEY_LENGTH_LIMIT) {
      throw new SigverError(SigverError.KEY_ERROR,
        `The key length exceeds the limit of ${KEY_LENGTH_LIMIT} characters`
      )
    }
  }

  validateId (id) {
    if (typeof id !== 'string') {
      throw new SigverError(SigverError.MESSAGE_ERROR, `The joining id is not a string`)
    }
  }
}
