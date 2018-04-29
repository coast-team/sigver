/// <reference types="node"/>

import * as crypto from 'crypto'

export class SigError extends Error {
  readonly code: number
  readonly name: string

  constructor(code: number, message = '') {
    super()
    this.name = this.constructor.name
    this.code = code
    this.message = `${code}: ${message}`
  }
}

// Inappropriate key format (e.g. key too long).
export const ERR_KEY = 4741

// Could not get the key.
export const ERR_NO_KEY = 4742

// Heartbeat error.
export const ERR_HEARTBEAT = 4743

// Any error due to message: type, format etc.
export const ERR_MESSAGE = 4744

// When only one member left in the group the joining peer could not establish a connection with him.
export const ERR_BLOCKING_MEMBER = 4745

const KEY_LENGTH_LIMIT = 512

export function validateKey(key: string) {
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

export function generateId(exclude: Set<number>): number {
  const id = crypto.randomBytes(4).readUInt32BE(0, true)
  return exclude.has(id) ? generateId(exclude) : id
}
