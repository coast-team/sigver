export class SigError extends Error {

  readonly code: number
  readonly name: string

  constructor (code: number, message = '') {
    super()
    this.name = this.constructor.name
    this.code = code
    this.message = `${code}: ${message}`
  }
}

// Inappropriate key format (e.g. key too long)
export const ERR_KEY = 4001

// Heartbeat error
export const ERR_HEARTBEAT = 4002

// Any error due to message: type, format etc.
export const ERR_MESSAGE = 4003

// When one member left and new peers could not join via him.
export const ERR_BLOCKING_MEMBER = 4004
