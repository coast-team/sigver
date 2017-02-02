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
    let msg
    try {
      msg = JSON.parse(data)
    } catch (err) {
      throw new SigverError(SigverError.MESSAGE_ERROR, 'The message is not a JSON string')
    }
    const keysNb = Object.keys(msg).length
    if (('open' in msg) && keysNb === 1) {
      this._openKey = msg.open
      this.validateKey()
    } else if ('join' in msg && keysNb === 1) {
      this._joinKey = msg.join
      this.validateKey()
    } else if ('data' in msg && keysNb === 1) {
      this.data = JSON.stringify(msg.data)
    } else if ('id' in msg && 'data' in msg && keysNb === 2) {
      this.data = JSON.stringify(msg.data)
      this.id = msg.id
      this.validateId()
    } else {
      throw new SigverError(SigverError.MESSAGE_ERROR, 'Unknown message')
    }
  }

  isToOpen () { return this._openKey !== undefined }

  isToJoin () { return this._joinKey !== undefined }

  isToTransmitToOpener () { return this.id === undefined }

  isToTransmitToJoining () { return this.id !== undefined }

  get key () { return this._openKey ? this._openKey : this._joinKey }

  static msgUnavailable (id) {
    return id ? `{"unavailable":${id}}` : `{"unavailable":-1}`
  }

  static msgOpened (opened) {
    return `{"opened":${opened}}`
  }

  msgToJoining () {
    return `{"data":${this.data}}`
  }

  msgToOpener (id) {
    return `{"id":${id},"data":${this.data}}`
  }

  validateKey () {
    if (this.key.length > KEY_LENGTH_LIMIT) {
      throw new SigverError(SigverError.KEY_ERROR,
        `The key length exceeds the limit of ${KEY_LENGTH_LIMIT} characters`
      )
    }
    if (typeof this.key !== 'string') {
      throw new SigverError(SigverError.KEY_ERROR, `The key ${this.key} is not a string`)
    }
    if (this.key === '') {
      throw new SigverError(SigverError.KEY_ERROR, `The key ${this.key} is an empty string`)
    }
  }

  validateId () {
    if (typeof this.id !== 'number') {
      throw new SigverError(SigverError.MESSAGE_ERROR, `The joining id is not a number`)
    }
  }

}
