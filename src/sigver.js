const WebSocketServer = require('uws').Server

const MAX_ID = 4294967295
const KEY_BYTE_LENGTH_LIMIT = 2048

// CloseEvent codes
const MESSAGE_FORMAT_ERROR = 4000
const MESSAGE_UNKNOWN = 4001
const KEY_ALREADY_EXISTS = 4002
const KEY_UNKNOWN = 4003
const KEY_NO_LONGER_AVAILABLE = 4004
const KEY_LENGTH_REACHED = 4005
const TRANSMIT_BEFORE_OPEN_OR_JOIN = 4006

// Predifined responces
let tmpDv

// Key not OK
const keyNotOk = new ArrayBuffer(1)
tmpDv = new DataView(keyNotOk)
tmpDv.setUint8(0, 10)

// Key OK
const keyOk = new ArrayBuffer(1)
tmpDv = new DataView(keyOk)
tmpDv.setUint8(0, 11)

// Joining client has disconnected
const clientDisconnected = new ArrayBuffer(1)
tmpDv = new DataView(clientDisconnected)
tmpDv.setUint8(0, 12)

// Transmitting before open or join request
const transmitNotAllowed = new ArrayBuffer(1)
tmpDv = new DataView(transmitNotAllowed)
tmpDv.setUint8(0, 13)

const openedClients = new Set()

class Sigver {
  constructor (options, onStart) {
    this.server = new WebSocketServer(options, () => {
      console.log(`Server runs on: ${this.server.host}`)
      onStart()
    })

    this.server.on('error', err => console.error(`Server error: ${err}`))

    this.server.on('connection', socket => {
      socket.on('message', (data, flags) => {
        try {
          if (!flags.binary) {
            throw new SigverError(socket, MESSAGE_FORMAT_ERROR,
              'Received message is not in binary format')
          }

          let dv = new DataView(data)
          switch (dv.getUInt8(0)) {
            // Open key
            case 1:
              openKey(socket, data)
              break
            // Join opened key
            case 2:
              joinKey(socket, data)
              break
            // Transmit message to joining peer
            case 3:
              transmitToJoining(socket, dv)
              break
            // Transmit message to the peer who opened the key
            case 4:
              transmitToOpened(socket, dv)
              break
            default:
              throw new SigverError(socket, MESSAGE_UNKNOWN, 'Unknown message')
          }
        } catch (err) {
          socket.close(err.code, err.message)
        }
      })
    })
  }

  close (cb) {
    console.log('Server has stopped successfully')
    this.server.close(cb)
  }

}

function openKey (socket, data) {
  if (data.byteLength > KEY_BYTE_LENGTH_LIMIT) {
    socket.send(keyNotOk, {binary: true})
    throw new SigverError(socket,
      KEY_LENGTH_REACHED,
      'Key too long'
    )
  }
  if (keyExists(data)) {
    socket.send(keyNotOk, {binary: true})
    throw new SigverError(socket,
      KEY_ALREADY_EXISTS,
      `The key ${msg.key} exists already`
    )
  }
  socket.$key = data
  socket.$joiningClients = new Map()
  openedClients.add(socket)
  socket.on('close', closeEvt => {
    openedClients.delete(socket)
    socket.$joiningClients.forEach(s => {
      s.close(KEY_NO_LONGER_AVAILABLE, `${msg.key} is no longer available`)
    })
  })
}

function joinKey (socket, data) {
  if (!keyExists(data)) {
    socket.send(keyNotOk, {binary: true})
    throw new SigverError(socket, KEY_UNKNOWN, 'Unknown key')
  }
  socket.send(keyOk, {binary: true})
  socket.$openedClient = getKeyHolder(data)
  let peers = socket.$openedClient.$joiningClients
  socket.$id = generateId(peers)
  peers.set(id, socket)
  socket.on('close', closeEvt => peers.delete(socket.$id))
}

function transmitToJoining (socket, dv) {
  if (!'$joiningClients' in socket) {
    socket.send(transmitNotAllowed, {binary: true})
    throw new SigverError(
      socket, TRANSMIT_BEFORE_OPEN_OR_JOIN,
      'Transmitting data before open or join request'
    )
  }
  let id = dv.getUInt32()
  let joiningClient = socket.$joiningClients.get(id)
  if (joiningClient) {
    let buf = new ArrayBuffer(dv.buffer.byteLength + 1)
    let ui8 = new UInt8Array(buf)
    ui8[0] = 14
    let source = new UInt8Array(dv.buffer)
    for (let i = 1; i < buf.byteLength; i++) {
      ui8[i] = source[i - 1]
    }
    joiningClient.send(buf, {binary: true})
  } else {
    socket.send(clientDisconnected, {binary: true})
  }
}

function transmitToOpened (socket, data) {
  if (!'$openedClient' in socket) {
    socket.send(transmitNotAllowed, {binary: true})
    throw new SigverError(
      socket, TRANSMIT_BEFORE_OPEN_OR_JOIN,
      'Transmitting data before open or join request'
    )
  }
  let buf = new ArrayBuffer(data.byteLength + 4)
  let dv = new DataView(buf)
  dv.setUint32(0, socket.$id)
  let ui8 = new UInt8Array(buf)
  let source = new UInt8Array(data)
  for (let i = 4; i < buf.byteLength; i++) {
    ui8[i] = source[i - 4]
  }
  socket.$openedClient.send(buf, {binary: true})
}

class SigverError extends Error {
  constructor (socket, code, message) {
    super(message)
    this.socket = socket
    this.code = code
  }
}

function keyExists (key) {
  let ui8;
  for (let s of openedClients) {
    ui8 = new UInt8Array(s.$key)
    for (let i = 1; i < s.$key.byteLength; i++) {
      if (h.$key === key) return true
    }
  }
  return false
}

function getKeyHolder (key) {
  for (let h of openedClients) if (h.$key === key) return h
  return null
}

function generateId (peers) {
  let id
  do {
    id = Math.ceil(Math.random() * MAX_ID)
    if (peers.has(id)) continue
    break
  } while (true)
  return id
}

export default Sigver
