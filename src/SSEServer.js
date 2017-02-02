import IOJsonString from './IOJsonString'
import Opener from './Opener'
import SseResponseWrapper from './SseResponseWrapper'
import SigverError from './SigverError'

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
  if ('$channel' in res) {
    res.$channel.close()
  } else {
    throw new Error('Error on sse client disconnect. This should not be happend, check usage of sse.addClient')
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
            sse.addClient(req, res, err => {
              if (err) {
                console.log('SSEServer: ' + new SigverError(SigverError.CROS_ERROR, err.message).message)
              } else {
                const sseChannel = new SseResponseWrapper(generateId(), sse, res)
                resps.set(sseChannel.id, sseChannel)
                sseChannel.send({event: 'auth', data: sseChannel.id})
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
              let channel = null
              try {
                const separator = body.indexOf('@')
                channel = resps.get(Number.parseInt(body.substring(0, separator), 10))
                if (channel === undefined) {
                  throw new SigverError(SigverError.AUTH_ERROR, 'Send message before authentication')
                }
                const data = body.substring(separator + 1)
                const ioMsg = new IOJsonString(data)

                if (ioMsg.isToOpen()) {
                  open(channel, ioMsg)
                } else if (ioMsg.isToJoin()) {
                  if (openers.has(ioMsg.key)) {
                    join(channel, ioMsg)
                  } else {
                    open(channel, ioMsg)
                  }
                } else if (ioMsg.isToTransmitToOpener()) {
                  transmitToOpener(channel, ioMsg)
                } else if (ioMsg.isToTransmitToJoining()) {
                  transmitToJoining(channel, ioMsg)
                }
              } catch (err) {
                if (err.name !== 'SigverError') {
                  console.log(`SSEServer: Error is not a SigverError instance: ${err.message}`)
                } else {
                  console.log(`SSEServer: ${err.message}`)
                }
                if (channel !== undefined) {
                  channel.send({
                    event: 'close',
                    data: JSON.stringify({ code: err.code, reason: err.message })
                  })
                  sse.removeClient(channel.res)
                }
              } finally {
                res.writeHead(200, {'Access-Control-Allow-Origin': req.headers.origin})
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

function open (channel, ioMsg) {
  const opener = new Opener(channel)
  if (openers.has(ioMsg.key)) {
    openers.get(ioMsg.key).add(opener)
  } else {
    const setOfOpeners = new Set()
    setOfOpeners.add(opener)
    openers.set(ioMsg.key, setOfOpeners)
  }
  channel.send(IOJsonString.msgOpened(true))
  opener.onclose = closeEvt => {
    const setOfOpeners = openers.get(ioMsg.key)
    setOfOpeners.delete(opener)
    if (setOfOpeners.size === 0) {
      openers.delete(ioMsg.key)
    }
  }
}

function join (channel, ioMsg) {
  openers.get(ioMsg.key).values().next().value.addJoining(channel)
  channel.send(IOJsonString.msgOpened(false))
}

function transmitToJoining (channel, ioMsg) {
  if (!('$opener' in channel)) {
    throw new SigverError(SigverError.TRANSMIT_BEFORE_OPEN, 'Transmitting data before open')
  }
  const joining = channel.$opener.getJoining(ioMsg.id)
  if (joining === undefined || !joining.opened) {
    channel.$opener.source.send(ioMsg.msgUnavailable(ioMsg.id))
  }
  joining.source.send(ioMsg.msgToJoining())
}

function transmitToOpener (channel, ioMsg) {
  if (!('$joining' in channel)) {
    throw new SigverError(SigverError.TRANSMIT_BEFORE_JOIN, 'Transmitting data before join')
  }
  const opener = channel.$joining.opener
  if (opener === undefined || !opener.opened) {
    channel.$joining.source.send(ioMsg.msgUnavailable())
  }
  opener.source.send(ioMsg.msgToOpener(channel.$joining.id))
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
