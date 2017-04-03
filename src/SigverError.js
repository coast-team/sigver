export default class SigverError extends Error {
  constructor (code, message = '') {
    super()
    this.code = code
    this.message = `${this.getCodeText()}: ${message}`
    this.name = this.constructor.name
  }

  // Unapropriate message format (e.g. message is not a valid JSON string).
  static get MESSAGE_ERROR () { return 4000 }

  // Unapropriate key format (e.g. key too long).
  static get KEY_ERROR () { return 4001 }

  // Pong message is not received during a certain delay.
  static get PING_ERROR () { return 4002 }

  static get RESPONSE_TIMEOUT_ERROR () { return 4003 }

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
      case SigverError.PING_ERROR: return 'PING_ERROR'
      case SigverError.RESPONSE_TIMEOUT_ERROR: return 'RESPONSE_TIMEOUT_ERROR'
      case SigverError.CROS_ERROR: return 'CROSS_ORIGIN_RESOURCE_SHARING_ERROR'
      case SigverError.AUTH_ERROR: return 'AUTHENTICATION_ERROR'
      default: return this.code
    }
  }
}
