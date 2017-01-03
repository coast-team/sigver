export default class SigverError {
  constructor (code, message) {
    Error.captureStackTrace(this, this.constructor)
    this.name = this.constructor.name
    this.message = code[0] + ': ' + message
    this.code = code[1]
  }

  static get MESSAGE_ERROR () { return ['MESSAGE_FORMAT_ERROR', 4000] }
  static get KEY_TOO_LONG () { return ['KEY_TOO_LONG', 4010] }
  static get KEY_FORMAT_ERROR () { return ['KEY_FORMAT_ERROR', 4011] }
  static get KEY_FOR_OPEN_EXISTS () { return ['KEY_EXISTS', 4012] }
  static get KEY_FOR_JOIN_UNKNOWN () { return ['KEY_UNKNOWN', 4013] }
  static get OPENER_GONE () { return ['OPENER_NO_LONGER_AVAILABLE', 4020] }
  static get JOINING_GONE () { return ['JOINING_NO_LONGER_AVAILABLE', 4021] }
  static get TRANSMIT_BEFORE_OPEN () { return ['TRANSMIT_BEFORE_OPEN', 4022] }
  static get TRANSMIT_BEFORE_JOIN () { return ['TRANSMIT_BEFORE_JOIN', 4023] }
}
