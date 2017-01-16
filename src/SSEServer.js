import IOJsonString from './IOJsonString'
import Opener from './Opener'
import SigverError from './error/SigverError'
import SSEError from './error/SSEError'

let SseChannel = {}
try {
  SseChannel = require('sse-channel')
} catch (err) {
  console.log('INFO: sse-channel package is not installed properly, thus EventSource server could not be run')
}
const http = require('http')

const MAX_ID = 2147483647 // int32 max value for id generation

const sse = new SseChannel({
  cors: {
    origins: ['*'],
    credentials: true
  }
})
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
      if (req.url === '/') {
        switch (req.method) {
          /*
           Authentication. This should be the first request by the client,
           made with EventSource API.
           */
          case 'GET': {
            sse.addClient(req, res, (err) => {
              if (err) {
                console.log('SSEServer: ' + new SigverError(SSEError.CROS_ERROR, err.message).message)
              } else {
                res.$id = generateId()
                resps.set(res.$id, res)
                sse.send({event: 'auth', data: res.$id}, [res])
              }
            })
            break
          }
          /*
           After client has been authenticated with the request above, he can
           send data to the server with POST request. The Authentication token,
           abtained previously should always be included into this request content.
           */
          case 'POST': {
            let body = []
            req.on('data', chunk => body.push(chunk))
            req.on('end', () => {
              body = Buffer.concat(body).toString()
              let myRes = null
              try {
                const separator = body.indexOf('@')
                myRes = resps.get(Number.parseInt(body.substring(0, separator), 10))
                if (myRes === undefined) {
                  throw new SigverError(SSEError.AUTH_ERROR, 'Send message before authentication')
                }
                const data = body.substring(separator + 1)
                const ioMsg = new IOJsonString(data)

                if (ioMsg.isToOpen()) {
                  open(myRes, ioMsg)
                } else if (ioMsg.isToJoin()) {
                  join(myRes, ioMsg)
                } else if (ioMsg.isToTransmitToOpener()) {
                  transmitToOpener(myRes, ioMsg)
                } else if (ioMsg.isToTransmitToJoining()) {
                  transmitToJoining(myRes, ioMsg)
                }
                res.writeHead(200, {'Access-Control-Allow-Origin': req.headers.origin})
              } catch (err) {
                let shouldSendError = true
                if (err.name !== 'SigverError') {
                  console.log(`SSEServer: Error is not a SigverError instance: ${err.message}`)
                } else if (err.code !== SigverError.JOINING_GONE) {
                  console.log(`SSEServer: ${err.message}`)
                } else {
                  shouldSendError = false
                  sse.send(IOJsonString.msgJoiningUnavailable(), [myRes])
                  res.writeHead(200, {'Access-Control-Allow-Origin': req.headers.origin})
                }
                if (shouldSendError) {
                  sse.removeClient(myRes)
                  res.writeHead(
                    SSEError.code(err.code),
                    err.message,
                    {'Access-Control-Allow-Origin': req.headers.origin}
                  )
                }
              } finally {
                res.end()
              }
            })
            break
          }
          default:
            res404(res, req.headers.origin)
        }
      } else {
        res404(res, req.headers.origin)
      }
    })

    this.server.listen(options.port, options.host, cb)
  }

  close (cb) {
    console.log('Server has stopped successfully')
    this.server.close(cb)
  }

}

function res404 (res, origin) {
  res.writeHead(404, {'Access-Control-Allow-Origin': origin})
  res.end()
}

function open (res, ioMsg) {
  if (openers.has(ioMsg.key)) {
    sse.send(IOJsonString.msgIsKeyOk(false), [res])
    throw new SigverError(SigverError.KEY_FOR_OPEN_EXISTS, `The key ${ioMsg.key} has already been used for open`)
  }
  const opener = new Opener(res)
  sse.send(IOJsonString.msgIsKeyOk(true), [res])
  opener.onclose = closeEvt => openers.delete(ioMsg.key)
  openers.set(ioMsg.key, opener)
}

function join (res, ioMsg) {
  if (!openers.has(ioMsg.key)) {
    sse.send(IOJsonString.msgIsKeyOk(false), [res])
    throw new SigverError(SigverError.KEY_FOR_JOIN_UNKNOWN, 'Unknown key')
  }
  const opener = openers.get(ioMsg.key)
  opener.addJoining(res)
  sse.send(IOJsonString.msgIsKeyOk(true), [res])
}

function transmitToJoining (res, ioMsg) {
  if (res !== undefined) {
    if (!('$opener' in res)) {
      throw new SigverError(SigverError.TRANSMIT_BEFORE_OPEN, 'Transmitting data before open')
    }
    const joining = res.$opener.getJoining(ioMsg.id)
    if (joining === undefined) {
      throw new SigverError(SigverError.JOINING_GONE, 'Joining is no longer available')
    }
    sse.send(ioMsg.msgToJoining(), [joining.source])
  }
}

function transmitToOpener (res, ioMsg) {
  if (res !== undefined) {
    if (!('$joining' in res)) {
      throw new SigverError(SigverError.TRANSMIT_BEFORE_JOIN, 'Transmitting data before join')
    }
    const opener = res.$joining.opener
    if (opener === undefined) {
      throw new SigverError(SigverError.OPENER_GONE, 'Opener is no longer available')
    }
    sse.send(ioMsg.msgToOpener(res.$joining.id), [opener.source])
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
