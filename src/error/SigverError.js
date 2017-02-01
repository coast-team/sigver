export default class SigverError {
  constructor (code, message) {
    Error.captureStackTrace(this, this.constructor)
    this.message = code + ': ' + message
    this.code = code
    this.name = this.constructor.name
  }

  // Unapropriate message format (e.g. message is not a valid JSON string).
  static get MESSAGE_ERROR () { return 'MESSAGE_ERROR' }

  // Unapropriate key format (e.g. key too long).
  static get KEY_ERROR () { return 'KEY_ERROR' }

  // Before starting transmit data, the first request should be either 'open' or 'join'.
  static get TRANSMIT_BEFORE_OPEN () { return 'TRANSMIT_BEFORE_OPEN' }
  static get TRANSMIT_BEFORE_JOIN () { return 'TRANSMIT_BEFORE_JOIN' }
}
