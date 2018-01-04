export class SigError extends Error {
  constructor (code, message = '') {
    super()
    this.name = this.constructor.name
    this.code = code
    for (const key in errorCodes) {
      if (errorCodes[key] === code) {
        this.message = `${key}: ${message}`
      }
    }
  }
}

// Inappropriate key format (e.g. key too long)
export const ERR_KEY = 4001

// Heart-beats error
export const ERR_HEARTBEAT = 4002

// Any error due to message: type, format etc.
export const ERR_MESSAGE = 4003

const errorCodes = {
  ERR_KEY,
  ERR_HEARTBEAT,
  ERR_MESSAGE
}
