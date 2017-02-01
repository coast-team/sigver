import SigverError from './SigverError'

export default class WSError {
  static code (err) {
    switch (err) {
      case SigverError.MESSAGE_ERROR: return 4000
      case SigverError.KEY_ERROR: return 4001
      case SigverError.TRANSMIT_BEFORE_OPEN: return 4022
      case SigverError.TRANSMIT_BEFORE_JOIN: return 4023
      default: throw new Error('Unknown Sigver Error')
    }
  }
}
