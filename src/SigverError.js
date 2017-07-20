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
  static get PONG_TIMEOUT_ERROR () { return 4002 }

  getCodeText () {
    switch (this.code) {
      case SigverError.KEY_ERROR: return 'KEY_ERROR'
      case SigverError.PONG_TIMEOUT_ERROR: return 'PONG_TIMEOUT_ERROR'
      default: return this.code
    }
  }
}
