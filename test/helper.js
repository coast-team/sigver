import { Message } from '../src/proto'

export function randomKey() {
  return String(Math.ceil(Math.random() * 99999))
}

export function decode(bytes) {
  return Message.decode(new Uint8Array(bytes))
}

export function encode(msg) {
  return Message.encode(Message.create(msg)).finish()
}

export function randomBytes() {
  const lengthBuf = 64 + 64 * Math.ceil(Math.random() * 100)
  const buffer = new ArrayBuffer(lengthBuf)
  const array = new Uint8Array(buffer)
  for (let i = 0; i < array.length; i++) {
    array[i] = Math.ceil(Math.random() * 100)
  }
  return array
}

export class Queue {
  constructor(length, afterAllDone) {
    this.counter = 0
    this.promises = []
    this.resolvers = []
    this.afterAllDone = afterAllDone
    for (let i = 0; i < length; i++) {
      this.promises.push(
        new Promise((resolve) => {
          this.resolvers.push(() => resolve())
        })
      )
    }
    Promise.all(this.promises).then(() => afterAllDone())
  }

  done() {
    if (this.counter < this.resolvers.length) {
      this.resolvers[this.counter++]()
    }
  }
}

function getKeyPrefix() {
  if (global && global.window === undefined) {
    return 'node'
  } else {
    const userAgent = window.navigator.userAgent
    return userAgent.includes('Firefox') ? 'firefox' : 'chrome'
  }
}

export const keyPrefix = getKeyPrefix()
