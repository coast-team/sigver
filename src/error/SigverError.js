export default class SigverError {
  constructor (code, message) {
    Error.captureStackTrace(this, this.constructor)
    this.message = code + ': ' + message
    this.code = code
    this.name = this.constructor.name
  }

  // Unapropriate message format, unknown message etc.
  static get MESSAGE_ERROR () { return 'MESSAGE_ERROR' }

  // Unapropriate key format, key too long etc.
  static get KEY_ERROR () { return 'KEY_ERROR' }

  static get KEY_FOR_OPEN_EXISTS () { return 'KEY_EXISTS' }
  static get KEY_FOR_JOIN_UNKNOWN () { return 'KEY_UNKNOWN' }

  // The connection with the opener has been closed, so the server can no longer transmit him any data
  static get OPENER_GONE () { return 'OPENER_NO_LONGER_AVAILABLE' }

  // Same, as previous for the joining
  static get JOINING_GONE () { return 'JOINING_NO_LONGER_AVAILABLE' }

  // Before starting transmit data, the first request should be either 'open' or 'join'
  static get TRANSMIT_BEFORE_OPEN () { return 'TRANSMIT_BEFORE_OPEN' }
  static get TRANSMIT_BEFORE_JOIN () { return 'TRANSMIT_BEFORE_JOIN' }
}
