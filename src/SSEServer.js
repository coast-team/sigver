import IOQueryString from './IOQueryString'
import Opener from './Opener'
import SigverError from './SigverError'

const SseChannel = require('sse-channel')
const http = require('http')

const MAX_ID = 2147483647 // int32 max value for id generation

const sse = new SseChannel({cors: {origins: ['*']}})
sse.on('disconnect', (channel, res) => {
  if ('$opener' in res) {
    res.$opener.close()
  } else if ('$joining' in res) {
    res.$joining.close()
  }
})
const openers = new Map()
const resps = new Map()

export default class SSEServer {

  constructor () {
    this.server = null
  }

  static start (options, cb = () => {}) {
    this.server = http.createServer((req, res) => {
      if ((req.url.startsWith('/?') && req.method === 'GET') || (req.url === '/' && req.method === 'POST')) {
        sse.addClient(req, res, error => {
          try {
            if (error) {
              const err = new SigverError(SigverError.CROS_ERROR, error.message)
              console.log(err.message)
            } else {
              const ioMsg = new IOQueryString(req.url.substring(2).toString())

              if (ioMsg.isToOpen()) {
                open(res, ioMsg)
              } else if (ioMsg.isToJoin()) {
                join(res, ioMsg)
              } else if (ioMsg.isToTransmitToOpener()) {
                transmitToOpener(ioMsg)
              } else if (ioMsg.isToTransmitToJoining()) {
                transmitToJoining(ioMsg)
              }
            }
          } catch (err) {
            if (err.name !== 'SigverError') {
              console.log('Error which not a SigverError instance: ', err)
            } else if (err.code !== SigverError.JOINING_GONE[1]) {
              console.log(err.message)
              if (err.code >= SigverError.KEY_ERROR[1] && err.code < SigverError.KEY_FOR_JOIN_UNKNOWN[1]) {
                sse.send(IOQueryString.msgKeyIsNotOk(err.code, err.message), [res])
              } else {
                sse.send(IOQueryString.msgError(err.code, err.message))
              }
            } else {
              sse.send(IOQueryString.msgJoiningUnavailable())
            }
            sse.removeClient(res)
          }
        })
      } else {
        res.writeHead(404)
        res.end()
      }
    })

    this.server.listen(options.port, options.host, cb)
  }

  close (cb) {
    console.log('Server has stopped successfully')
    this.server.close(cb)
  }

}

function open (res, ioMsg) {
  if (openers.has(ioMsg.key)) {
    throw new SigverError(SigverError.KEY_FOR_OPEN_EXISTS, `The key ${ioMsg.key} has already been used for open`)
  }
  res.$id = generateId()
  resps.set(res.$id, res)
  const opener = new Opener(res)
  sse.send(IOQueryString.msgKeyIsOk(res.$id), [res])
  opener.onclose = closeEvt => openers.delete(ioMsg.key)
  openers.set(ioMsg.key, opener)
}

function join (res, ioMsg) {
  if (!openers.has(ioMsg.key)) {
    throw new SigverError(SigverError.KEY_FOR_JOIN_UNKNOWN, 'Unknown key')
  }
  res.$id = generateId()
  resps.set(res.$id, res)
  const opener = openers.get(ioMsg.key)
  opener.addJoining(res)
  sse.send(IOQueryString.msgKeyIsOk(res.$id), [res])
}

function transmitToJoining (ioMsg) {
  const joiningSource = resps.get(Number.parseInt(ioMsg.myId, 10))
  if (joiningSource !== undefined) {
    if (!('$opener' in joiningSource)) {
      throw new SigverError(SigverError.TRANSMIT_BEFORE_OPEN, 'Transmitting data before open')
    }
    const joining = joiningSource.$opener.getJoining(ioMsg.id)
    if (joining === undefined) {
      throw new SigverError(SigverError.JOINING_GONE, 'Joining is no longer available')
    }
    sse.send(ioMsg.msgToJoining(), [joining.source])
  }
}

function transmitToOpener (ioMsg) {
  const openerSource = resps.get(Number.parseInt(ioMsg.myId, 10))
  if (openerSource !== undefined) {
    if (!('$joining' in openerSource)) {
      throw new SigverError(SigverError.TRANSMIT_BEFORE_JOIN, 'Transmitting data before join')
    }
    const opener = openerSource.$joining.opener
    if (opener === undefined) {
      throw new SigverError(SigverError.OPENER_GONE, 'Opener is no longer available')
    }
    sse.send(ioMsg.msgToOpener(openerSource.$joining.id), [opener.source])
  }
}

function generateId () {
  let id
  do {
    id = Math.ceil(Math.random() * MAX_ID)
    if (resps.has(id)) continue
    break
  } while (true)
  return id
}
