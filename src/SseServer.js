import IOJsonString from './IOJsonString'
import ServerCore from './ServerCore'
import SseResponseWrapper from './SseResponseWrapper'
import SigverError from './SigverError'

let SseChannel = {}
try {
  SseChannel = require('sse-channel')
} catch (err) {
  console.log('INFO: sse-channel module is not installed properly, thus EventSource server cannot be run')
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
const resps = new Map()

/**
 * Server-Sent-Event server. Client should use EventSource API together
 * with Ajax (Fetch or XMLHttpRequest API for example). EventSource is
 * used for server to notify client and Ajax is used by client to send
 * data to the server.
 */
export default class SseServer extends ServerCore {
  start (options, cb = () => {}) {
    // Starting server
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
                console.log('SseServer: ' + new SigverError(SigverError.CROS_ERROR, err.message).message)
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
              let resWrapper
              try {
                const separator = body.indexOf('@')
                resWrapper = resps.get(Number.parseInt(body.substring(0, separator), 10))
                if (resWrapper === undefined) {
                  throw new SigverError(SigverError.AUTH_ERROR, 'Send message before authentication')
                }
                const data = body.substring(separator + 1)

                super.handleMessage(resWrapper, new IOJsonString(data))
              } catch (err) {
                if (err.name !== 'SigverError') {
                  console.log(`SseServer: Error is not a SigverError instance: ${err.message}`)
                } else {
                  console.log(`SseServer: ${err.message}`)
                }
                if (resWrapper !== undefined) {
                  resWrapper.send({
                    event: 'close',
                    data: JSON.stringify({ code: err.code, reason: err.message })
                  })
                  sse.removeClient(resWrapper.res)
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
}

function res404 (res, origin) {
  res.writeHead(404, {'Access-Control-Allow-Origin': origin})
  res.end()
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
