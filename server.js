#!/usr/bin/env node
(function () {
'use strict';

class SigverError {
  constructor (code, message) {
    Error.captureStackTrace(this, this.constructor);
    this.message = code + ': ' + message;
    this.code = code;
    this.name = this.constructor.name;
  }

  // Unapropriate message format (e.g. message is not a valid JSON string).
  static get MESSAGE_ERROR () { return 'MESSAGE_ERROR' }

  // Unapropriate key format (e.g. key too long).
  static get KEY_ERROR () { return 'KEY_ERROR' }

  // Before starting transmit data, the first request should be either 'open' or 'join'.
  static get TRANSMIT_BEFORE_OPEN () { return 'TRANSMIT_BEFORE_OPEN' }
  static get TRANSMIT_BEFORE_JOIN () { return 'TRANSMIT_BEFORE_JOIN' }
}

const KEY_LENGTH_LIMIT = 512;

class IOJsonString {

  constructor (data) {
    this.id = undefined;
    this.data = undefined;

    this._openKey = undefined;
    this._joinKey = undefined;
    let msg;
    try {
      msg = JSON.parse(data);
    } catch (err) {
      throw new SigverError(SigverError.MESSAGE_ERROR, 'The message is not a JSON string')
    }
    const keysNb = Object.keys(msg).length;
    if (('open' in msg) && keysNb === 1) {
      this._openKey = msg.open;
      this.validateKey();
    } else if ('join' in msg && keysNb === 1) {
      this._joinKey = msg.join;
      this.validateKey();
    } else if ('data' in msg && keysNb === 1) {
      this.data = JSON.stringify(msg.data);
    } else if ('id' in msg && 'data' in msg && keysNb === 2) {
      this.data = JSON.stringify(msg.data);
      this.id = msg.id;
      this.validateId();
    } else {
      throw new SigverError(SigverError.MESSAGE_ERROR, 'Unknown message')
    }
  }

  isToOpen () { return this._openKey !== undefined }

  isToJoin () { return this._joinKey !== undefined }

  isToTransmitToOpener () { return this.id === undefined }

  isToTransmitToJoining () { return this.id !== undefined }

  get key () { return this._openKey ? this._openKey : this._joinKey }

  static msgUnavailable (id) {
    return id ? `{"unavailable":${id}}` : `{"unavailable":-1}`
  }

  static msgOpened (opened) {
    return `{"opened":${opened}}`
  }

  msgToJoining () {
    return `{"data":${this.data}}`
  }

  msgToOpener (id) {
    return `{"id":${id},"data":${this.data}}`
  }

  validateKey () {
    if (this.key.length > KEY_LENGTH_LIMIT) {
      throw new SigverError(SigverError.KEY_ERROR,
        `The key length exceeds the limit of ${KEY_LENGTH_LIMIT} characters`
      )
    }
    if (typeof this.key !== 'string') {
      throw new SigverError(SigverError.KEY_ERROR, `The key ${this.key} is not a string`)
    }
    if (this.key === '') {
      throw new SigverError(SigverError.KEY_ERROR, `The key ${this.key} is an empty string`)
    }
  }

  validateId () {
    if (typeof this.id !== 'number') {
      throw new SigverError(SigverError.MESSAGE_ERROR, `The joining id is not a number`)
    }
  }

}

class Joining {
  constructor (source, opener, id) {
    this.source = source;
    this.source.$joining = this;
    this.opener = opener;
    this.id = id;

    if (source.constructor.name !== 'ServerResponse') {
      this.source.onclose = closeEvt => this.close();
    }
  }

  close () {
    if (this.opener) {
      this.opener.deleteJoining(this);
    }
  }
}

const MAX_ID = 2147483647; // int32 max value for id generation

class Opener {
  constructor (source) {
    source.$opener = this;
    this.source = source;
    this.joinings = new Map();
    this.onclose = () => {};

    if (source.constructor.name !== 'ServerResponse') {
      this.source.onclose = closeEvt => this.close();
    }
  }

  close () {
    this.onclose();
    this.joinings.forEach(j => { j.opener = undefined; });
  }

  getJoining (id) {
    return this.joinings.get(id)
  }

  addJoining (source) {
    const id = this.generateId();
    const joining = new Joining(source, this, id);
    this.joinings.set(id, joining);
    return joining
  }

  deleteJoining (joining) {
    this.joinings.delete(joining.id);
  }

  generateId () {
    let id;
    do {
      id = Math.ceil(Math.random() * MAX_ID);
      if (this.joinings.has(id)) continue
      break
    } while (true)
    return id
  }
}

class WSError {
  static code (err) {
    switch (err) {
      case SigverError.MESSAGE_ERROR: return 4000
      case SigverError.KEY_ERROR: return 4001
      case SigverError.TRANSMIT_BEFORE_OPEN: return 4022
      case SigverError.TRANSMIT_BEFORE_JOIN: return 4023
      default: throw new Error('Unknown Sigver Error')
    }
  }
}

let WebSocket = {};
try {
  WebSocket = require('uws');
} catch (err) {
  console.log('INFO: could not find uws package, try to use ws instead ' + err.message);
  try {
    WebSocket = require('ws');
  } catch (err2) {
    console.log('ERROR: could not find ws package too, this the server cannot be run ' + err2.message);
  }
}
const WebSocketServer = WebSocket.Server;

const openers = new Map();

class WSServer {

  constructor () {
    this.server = null;
  }

  static start (options, cb = () => {}) {
    this.server = new WebSocketServer(options, cb);

    this.server.on('error', err => console.error(`Server error: ${err}`));

    this.server.on('connection', socket => {
      socket.onmessage = msgEvent => {
        try {
          const ioMsg = new IOJsonString(msgEvent.data);
          if (ioMsg.isToOpen()) {
            open(socket, ioMsg);
          } else if (ioMsg.isToJoin()) {
            join(socket, ioMsg);
          } else if (ioMsg.isToTransmitToOpener()) {
            transmitToOpener(socket, ioMsg);
          } else if (ioMsg.isToTransmitToJoining()) {
            transmitToJoining(socket, ioMsg);
          }
        } catch (err) {
          if (err.name !== 'SigverError') {
            console.log('Error which not a SigverError instance: ', err);
          } else {
            console.log(err.message);
            socket.close(WSError.code(err.code), err.message);
          }
        }
      };
    });
  }

  close (cb) {
    console.log('Server has stopped successfully');
    this.server.close(cb);
  }

}

function errorOnSendCB (err) {
  if (err) {
    console.log(`Socket error while sending ${err.code}: ${err.reason}`);
  }
}

function open (socket, ioMsg) {
  const opener = new Opener(socket);
  if (openers.has(ioMsg.key)) {
    openers.get(ioMsg.key).add(opener);
  } else {
    const setOfOpeners = new Set();
    setOfOpeners.add(opener);
    openers.set(ioMsg.key, setOfOpeners);
  }
  socket.send(IOJsonString.msgOpened(true), errorOnSendCB);
  opener.onclose = closeEvt => {
    const setOfOpeners = openers.get(ioMsg.key);
    setOfOpeners.delete(opener);
    if (setOfOpeners.size === 0) {
      openers.delete(ioMsg.key);
    }
  };
}

function join (socket, ioMsg) {
  if (openers.has(ioMsg.key)) {
    openers.get(ioMsg.key).values().next().value.addJoining(socket);
    socket.send(IOJsonString.msgOpened(false), errorOnSendCB);
  } else {
    open(socket, ioMsg);
  }
}

function transmitToJoining (socket, ioMsg) {
  if (!('$opener' in socket)) {
    throw new SigverError(SigverError.TRANSMIT_BEFORE_OPEN, 'Transmitting data before open')
  }
  const joining = socket.$opener.getJoining(ioMsg.id);
  if (joining === undefined || joining.source.readyState !== WebSocket.OPEN) {
    // The connection with the opener has been closed, so the server can no longer transmit him any data.
    socket.$opener.source.send(ioMsg.msgUnavailable(ioMsg.id));
  }
  joining.source.send(ioMsg.msgToJoining(), errorOnSendCB);
}

function transmitToOpener (socket, ioMsg) {
  if (!('$joining' in socket)) {
    throw new SigverError(SigverError.TRANSMIT_BEFORE_JOIN, 'Transmitting data before join')
  }
  const opener = socket.$joining.opener;
  if (opener === undefined || opener.source.readyState !== WebSocket.OPEN) {
    // Same, as previous for the joining
    socket.$joining.source.send(ioMsg.msgUnavailable());
  }
  opener.source.send(ioMsg.msgToOpener(socket.$joining.id), errorOnSendCB);
}

class SSEError {

  /*
   The Cross-Origin Resource Sharing error. Occurs when the request
   was cross-origin and did not validate against the provided
   CORS configuration.
   */
  static get CROS_ERROR () { return 'CROSS_ORIGIN_RESOURCE_SHARING_ERROR' }

  /*
  The client did not authenticate before sending data
   */
  static get AUTH_ERROR () { return 'AUTHENTICATION_ERROR' }

  static code (err) {
    switch (err) {
      case SigverError.MESSAGE_ERROR: return 520
      case SigverError.KEY_ERROR: return 521
      case SigverError.KEY_FOR_OPEN_EXISTS: return 560
      case SigverError.KEY_FOR_JOIN_UNKNOWN: return 561
      case SigverError.OPENER_GONE: return 570
      case SigverError.JOINING_GONE: return 571
      case SigverError.TRANSMIT_BEFORE_OPEN: return 572
      case SigverError.TRANSMIT_BEFORE_JOIN: return 573
      case SSEError.CROS_ERROR: return 580
      case SSEError.AUTH_ERROR: return 581
      default: throw new Error('Unknown Sigver Error')
    }
  }
}

let SseChannel = {};
try {
  SseChannel = require('sse-channel');
} catch (err) {
  console.log('INFO: sse-channel package is not installed properly, thus EventSource server could not be run');
}
const http = require('http');

const MAX_ID$1 = 2147483647; // int32 max value for id generation

const sse = new SseChannel({
  cors: {
    origins: ['*'],
    credentials: true
  }
});
sse.on('disconnect', (channel, res) => {
  if ('$opener' in res) {
    res.$opener.close();
  } else if ('$joining' in res) {
    res.$joining.close();
  }
});
const openers$1 = new Map();
const resps = new Map();

class SSEServer {

  constructor () {
    this.server = null;
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
                console.log('SSEServer: ' + new SigverError(SSEError.CROS_ERROR, err.message).message);
              } else {
                res.$id = generateId();
                resps.set(res.$id, res);
                sse.send({event: 'auth', data: res.$id}, [res]);
              }
            });
            break
          }
          /*
           After client has been authenticated with the request above, he can
           send data to the server with POST request. The Authentication token,
           abtained previously should always be included into this request content.
           */
          case 'POST': {
            let body = [];
            req.on('data', chunk => body.push(chunk));
            req.on('end', () => {
              body = Buffer.concat(body).toString();
              let myRes = null;
              try {
                const separator = body.indexOf('@');
                myRes = resps.get(Number.parseInt(body.substring(0, separator), 10));
                if (myRes === undefined) {
                  throw new SigverError(SSEError.AUTH_ERROR, 'Send message before authentication')
                }
                const data = body.substring(separator + 1);
                const ioMsg = new IOJsonString(data);

                if (ioMsg.isToOpen()) {
                  open$1(myRes, ioMsg);
                } else if (ioMsg.isToJoin()) {
                  join$1(myRes, ioMsg);
                } else if (ioMsg.isToTransmitToOpener()) {
                  transmitToOpener$1(myRes, ioMsg);
                } else if (ioMsg.isToTransmitToJoining()) {
                  transmitToJoining$1(myRes, ioMsg);
                }
                res.writeHead(200, {'Access-Control-Allow-Origin': req.headers.origin});
              } catch (err) {
                let shouldSendError = true;
                if (err.name !== 'SigverError') {
                  console.log(`SSEServer: Error is not a SigverError instance: ${err.message}`);
                } else if (err.code !== SigverError.JOINING_GONE) {
                  console.log(`SSEServer: ${err.message}`);
                } else {
                  shouldSendError = false;
                  sse.send(IOJsonString.msgJoiningUnavailable(), [myRes]);
                  res.writeHead(200, {'Access-Control-Allow-Origin': req.headers.origin});
                }
                if (shouldSendError) {
                  sse.removeClient(myRes);
                  res.writeHead(
                    SSEError.code(err.code),
                    err.message,
                    {'Access-Control-Allow-Origin': req.headers.origin}
                  );
                }
              } finally {
                res.end();
              }
            });
            break
          }
          default:
            res404(res, req.headers.origin);
        }
      } else {
        res404(res, req.headers.origin);
      }
    });

    this.server.listen(options.port, options.host, cb);
  }

  close (cb) {
    console.log('Server has stopped successfully');
    this.server.close(cb);
  }

}

function res404 (res, origin) {
  res.writeHead(404, {'Access-Control-Allow-Origin': origin});
  res.end();
}

function open$1 (res, ioMsg) {
  if (openers$1.has(ioMsg.key)) {
    sse.send(IOJsonString.msgIsKeyOk(false), [res]);
    throw new SigverError(SigverError.KEY_FOR_OPEN_EXISTS, `The key ${ioMsg.key} has already been used for open`)
  }
  const opener = new Opener(res);
  sse.send(IOJsonString.msgIsKeyOk(true), [res]);
  opener.onclose = closeEvt => openers$1.delete(ioMsg.key);
  openers$1.set(ioMsg.key, opener);
}

function join$1 (res, ioMsg) {
  if (!openers$1.has(ioMsg.key)) {
    sse.send(IOJsonString.msgIsKeyOk(false), [res]);
    throw new SigverError(SigverError.KEY_FOR_JOIN_UNKNOWN, 'Unknown key')
  }
  const opener = openers$1.get(ioMsg.key);
  opener.addJoining(res);
  sse.send(IOJsonString.msgIsKeyOk(true), [res]);
}

function transmitToJoining$1 (res, ioMsg) {
  if (res !== undefined) {
    if (!('$opener' in res)) {
      throw new SigverError(SigverError.TRANSMIT_BEFORE_OPEN, 'Transmitting data before open')
    }
    const joining = res.$opener.getJoining(ioMsg.id);
    if (joining === undefined) {
      throw new SigverError(SigverError.JOINING_GONE, 'Joining is no longer available')
    }
    sse.send(ioMsg.msgToJoining(), [joining.source]);
  }
}

function transmitToOpener$1 (res, ioMsg) {
  if (res !== undefined) {
    if (!('$joining' in res)) {
      throw new SigverError(SigverError.TRANSMIT_BEFORE_JOIN, 'Transmitting data before join')
    }
    const opener = res.$joining.opener;
    if (opener === undefined) {
      throw new SigverError(SigverError.OPENER_GONE, 'Opener is no longer available')
    }
    sse.send(ioMsg.msgToOpener(res.$joining.id), [opener.source]);
  }
}

function generateId () {
  let id;
  do {
    id = Math.ceil(Math.random() * MAX_ID$1);
    if (resps.has(id)) continue
    break
  } while (true)
  return id
}

const program = require('commander');

let host = process.env.NODE_IP || '0.0.0.0';
let port = process.env.NODE_PORT || 8000;
let type = 'ws';

program
  .version('8.1.0', '-v, --version')
  .option('-h, --host <n>', 'select host address to bind to, DEFAULT: process.env.NODE_IP || "0.0.0.0"')
  .option('-p, --port <n>', 'select port to use, DEFAULT: process.env.NODE_PORT || 8000')
  .option('-t, --type <value>',
`specify the server type. The possible values are:
  ws - for WebSocket only ("ws://host:port"). This is DEFAULT
  sse - for Server-Sent-Event only ("http://host:port")
`)
  .on('--help', () => {
    console.log(
`  Examples:

     $ sigver                         # Server is listening on ws://0.0.0.0:8000
     $ sigver -h 192.168.0.1 -p 9000  # Server is listening on ws://192.168.0.1:9000
     $ sigver -t sse -p 9000          # Server is listening on http://0.0.0.0:9000
`);
  })
  .parse(process.argv);

if (program.host) host = program.host;
if (program.port) port = program.port;
if (program.type) type = program.type;

switch (type) {
  case 'ws':
    WSServer.start({host, port}, () => {
      console.log(`WebSocket server is listening on: ws://${host}:${port}`);
    });
    break
  case 'sse':
    SSEServer.start({host, port}, () => {
      console.log(`EventSource server is listening on: http://${host}:${port}`);
    });
    break
}

}());
