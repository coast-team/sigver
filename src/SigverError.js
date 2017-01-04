export default class SigverError {
  constructor (code, message) {
    Error.captureStackTrace(this, this.constructor)
    this.name = this.constructor.name
    this.message = code[0] + ': ' + message
    this.code = code[1]
  }

  // Unapropriate message format, unknown message etc.
  static get MESSAGE_ERROR () { return ['MESSAGE_ERROR', 4000] }

  // Unapropriate key format, key too long etc.
  static get KEY_ERROR () { return ['KEY_ERROR', 4001] }

  static get KEY_FOR_OPEN_EXISTS () { return ['KEY_EXISTS', 4010] }
  static get KEY_FOR_JOIN_UNKNOWN () { return ['KEY_UNKNOWN', 4011] }

  // The connection with the opener has been closed, so the server can no longer transmit him any data
  static get OPENER_GONE () { return ['OPENER_NO_LONGER_AVAILABLE', 4020] }

  // Same, as previous for the joining
  static get JOINING_GONE () { return ['JOINING_NO_LONGER_AVAILABLE', 4021] }

  // Before starting transmit data, the first request should be either 'open' or 'join'
  static get TRANSMIT_BEFORE_OPEN () { return ['TRANSMIT_BEFORE_OPEN', 4022] }
  static get TRANSMIT_BEFORE_JOIN () { return ['TRANSMIT_BEFORE_JOIN', 4023] }
}
