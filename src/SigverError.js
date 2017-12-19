export default class SigverError extends Error {
  constructor (code, message = '') {
    super()
    this.code = code
    this.message = `${this.getCodeText()}: ${message}`
    this.name = this.constructor.name
  }

  // Unapropriate key format (e.g. key too long).
  static get KEY_ERROR () { return 4001 }

  // Pong message is not received during a certain delay.
  static get HEARTBEAT_ERROR_CODE () { return 4002 }

  getCodeText () {
    switch (this.code) {
      case SigverError.KEY_ERROR: return 'KEY_ERROR'
      case SigverError.HEARTBEAT_ERROR_CODE: return 'HEARTBEAT_ERROR_CODE'
      default: return this.code
    }
  }
}
