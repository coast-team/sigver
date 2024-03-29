export class SigError extends Error {
  declare readonly name: 'SigError'
  declare readonly code: number

  constructor(code: number, message: string) {
    super(`${code}: ${message}`)
    this.name = 'SigError'
    this.code = code
  }
}

// Inappropriate key format (e.g. key too long).
export const ERR_KEY = 4741

// Heartbeat error.
export const ERR_HEARTBEAT = 4742

// Any error due to message: type, format etc.
export const ERR_MESSAGE = 4743

// When only one member left in the group the joining peer could not establish a connection with him.
export const ERR_BLOCKING_MEMBER = 4744

export const ERR_URL = 4745

const KEY_LENGTH_LIMIT = 512

export function validateKey(key: string): void {
  if (key === '') {
    throw new SigError(ERR_KEY, `The key ${key} is an empty string`)
  }
  if (key.length > KEY_LENGTH_LIMIT) {
    throw new SigError(
      ERR_KEY,
      `The key length exceeds the limit of ${KEY_LENGTH_LIMIT} characters`
    )
  }
}
