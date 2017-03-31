export default class SigverError {
  constructor (code, message) {
    Error.captureStackTrace(this, this.constructor)
    this.code = code
    this.message = `${this.getCodeText()}=${this.code}: ${message}`
    this.name = this.constructor.name
  }

  // Unapropriate message format (e.g. message is not a valid JSON string).
  static get MESSAGE_ERROR () { return 4000 }

  // Unapropriate key format (e.g. key too long).
  static get KEY_ERROR () { return 4001 }

  /*
   The Cross-Origin Resource Sharing error. Occurs when the request
   was cross-origin and did not validate against the provided
   CORS configuration.
   */
  static get CROS_ERROR () { return 4020 }

  /*
  The client did not authenticate before sending data
   */
  static get AUTH_ERROR () { return 4021 }

  getCodeText () {
    switch (this.code) {
      case SigverError.MESSAGE_ERROR: return 'MESSAGE_ERROR'
      case SigverError.KEY_ERROR: return 'KEY_ERROR'
      case SigverError.TRANSMIT_BEFORE_OPEN: return 'TRANSMIT_BEFORE_OPEN'
      case SigverError.TRANSMIT_BEFORE_JOIN: return 'TRANSMIT_BEFORE_JOIN'
      case SigverError.CROS_ERROR: return 'CROSS_ORIGIN_RESOURCE_SHARING_ERROR'
      case SigverError.AUTH_ERROR: return 'AUTHENTICATION_ERROR'
      default: throw new Error('Unknown SigverError code')
    }
  }
}
