import * as crypto from 'crypto'

const generatedIds = new Set<number>()

function randomU31(): number {
  return crypto.randomBytes(4).readUInt32BE(0) >>> 1
}

export function generateId(): number {
  let id: number
  do {
    id = randomU31()
  } while (id === 0 || generatedIds.has(id))
  generatedIds.add(id)
  return id
}

export function dismissId(id: number): void {
  generatedIds.delete(id)
}
