import { Message } from '../src/proto/index'

export function randomKey () {
  return String(Math.ceil(Math.random() * 99999))
}

export function decode (bytes) {
  return Message.decode(new Uint8Array(bytes))
}

export function encode (msg) {
  return Message.encode(Message.create(msg)).finish()
}

export function randomBytes () {
  const lengthBuf = 64 + 64 * Math.ceil(Math.random() * 100)
  const buffer = new ArrayBuffer(lengthBuf)
  const array = new Uint8Array(buffer)
  for (let i = 0; i < array.length; i++) {
    array[i] = Math.ceil(Math.random() * 100)
  }
  return array
}
