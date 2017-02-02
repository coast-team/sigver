import SigverError from './SigverError'

export default class SSEError {

  /*
   The Cross-Origin Resource Sharing error. Occurs when the request
   was cross-origin and did not validate against the provided
   CORS configuration.
   */
  static get CROS_ERROR () { return 'CROSS_ORIGIN_RESOURCE_SHARING_ERROR' }

  /*
  The client did not authenticate before sending data
   */
  static get AUTH_ERROR () { return 'AUTHENTICATION_ERROR' }

  static code (err) {
    switch (err) {
      case SigverError.MESSAGE_ERROR: return 520
      case SigverError.KEY_ERROR: return 521
      case SigverError.TRANSMIT_BEFORE_OPEN: return 572
      case SigverError.TRANSMIT_BEFORE_JOIN: return 573
      case SSEError.CROS_ERROR: return 580
      case SSEError.AUTH_ERROR: return 581
      default: throw new Error('Unknown Sigver Error')
    }
  }
}
