#!/usr/bin/env node
(function () {
'use strict';

class IO {
  isToOpen () {}

  isToJoin () {}

  isToTransmitToOpener () {}

  isToTransmitToJoining () {}
}

class SigverError {
  constructor (code, message) {
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = code[0] + ': ' + message;
    this.code = code[1];
  }

  // Unapropriate message format, unknown message etc.
  static get MESSAGE_ERROR () { return ['MESSAGE_ERROR', 4000] }

  // Unapropriate key format, key too long etc.
  static get KEY_ERROR () { return ['KEY_ERROR', 4001] }

  static get KEY_FOR_OPEN_EXISTS () { return ['KEY_EXISTS', 4010] }
  static get KEY_FOR_JOIN_UNKNOWN () { return ['KEY_UNKNOWN', 4011] }

  // The connection with the opener has been closed, so the server can no longer transmit him any data
  static get OPENER_GONE () { return ['OPENER_NO_LONGER_AVAILABLE', 4020] }

  // Same, as previous for the joining
  static get JOINING_GONE () { return ['JOINING_NO_LONGER_AVAILABLE', 4021] }

  // Before starting transmit data, the first request should be either 'open' or 'join'
  static get TRANSMIT_BEFORE_OPEN () { return ['TRANSMIT_BEFORE_OPEN', 4022] }
  static get TRANSMIT_BEFORE_JOIN () { return ['TRANSMIT_BEFORE_JOIN', 4023] }

  /*
   The Cross-Origin Resource Sharing error. Occurs when the request
   was cross-origin and did not validate against the provided
   CORS configuration.
   */
  static get CROS_ERROR () { return ['CROSS_ORIGIN_RESOURCE_SHARING_ERROR', 4030] }
}

const KEY_LENGTH_LIMIT = 512;

class IOJsonString extends IO {

  constructor (data) {
    super();
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

  static msgIsKeyOk (isOk) {
    return `{"isKeyOk":${isOk}}`
  }

  static msgJoiningUnavailable (id) {
    return `{"id":${id},"unavailable":"true"}`
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

const WebSocket = require('uws');
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
          } else if (err.code !== SigverError.JOINING_GONE) {
            console.log(err.message);
            socket.close(err.code, err.message);
          } else {
            socket.send(IOJsonString.msgJoiningUnavailable(), errorOnSendCB);
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
  if (openers.has(ioMsg.key)) {
    socket.send(IOJsonString.msgIsKeyOk(false), errorOnSendCB);
    throw new SigverError(SigverError.KEY_FOR_OPEN_EXISTS, `The key "${ioMsg.key}" has already been used for open`)
  }
  socket.send(IOJsonString.msgIsKeyOk(true), errorOnSendCB);
  const opener = new Opener(socket);
  opener.onclose = closeEvt => openers.delete(ioMsg.key);
  openers.set(ioMsg.key, opener);
}

function join (socket, ioMsg) {
  if (!openers.has(ioMsg.key)) {
    socket.send(IOJsonString.msgIsKeyOk(false), errorOnSendCB);
    throw new SigverError(SigverError.KEY_FOR_JOIN_UNKNOWN, 'Unknown key')
  }
  socket.send(IOJsonString.msgIsKeyOk(true), errorOnSendCB);
  const opener = openers.get(ioMsg.key);
  opener.addJoining(socket);
}

function transmitToJoining (socket, ioMsg) {
  if (!('$opener' in socket)) {
    throw new SigverError(SigverError.TRANSMIT_BEFORE_OPEN, 'Transmitting data before open')
  }
  const joining = socket.$opener.getJoining(ioMsg.id);
  if (joining === undefined || joining.source.readyState !== WebSocket.OPEN) {
    throw new SigverError(SigverError.JOINING_GONE, 'Joining is no longer available')
  }
  joining.source.send(ioMsg.msgToJoining(), errorOnSendCB);
}

function transmitToOpener (socket, ioMsg) {
  if (!('$joining' in socket)) {
    throw new SigverError(SigverError.TRANSMIT_BEFORE_JOIN, 'Transmitting data before join')
  }
  const opener = socket.$joining.opener;
  if (opener === undefined || opener.source.readyState !== WebSocket.OPEN) {
    throw new SigverError(SigverError.OPENER_GONE, 'Opener is no longer available')
  }
  opener.source.send(ioMsg.msgToOpener(socket.$joining.id), errorOnSendCB);
}

const querystring = require('querystring');

const KEY_LENGTH_LIMIT$1 = 512;

class IOQueryString extends IO {

  constructor (query) {
    super();
    this.myId = undefined;
    this.id = undefined;
    this.data = undefined;

    this._openKey = undefined;
    this._joinKey = undefined;
    let msg;
    try {
      msg = querystring.parse(query);
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
    } else if ('data' in msg && 'myId' in msg && keysNb === 2) {
      this.data = JSON.stringify(msg.data);
      this.myId = Number.parseInt(msg.myId, 10);
    } else if ('id' in msg && 'data' in msg && 'myId' in msg && keysNb === 3) {
      this.data = JSON.stringify(msg.data);
      this.id = Number.parseInt(msg.id, 10);
      this.myId = Number.parseInt(msg.myId, 10);
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

  static msgKeyIsOk (id) {
    return `{"isKeyOk":true,"id":${id}}`
  }

  static msgKeyIsNotOk (code, message) {
    return `{"isKeyOk":false,"error":${code},"message":"${message}"}`
  }

  static msgJoiningUnavailable (id) {
    return `{"id":${id},"unavailable":"true"}`
  }

  static msgError (code, message) {
    return `{"error":${code},"message":"${message}"}`
  }

  msgToJoining () {
    return `{"data":${this.data}}`
  }

  msgToOpener (id) {
    return `{"id":${id},"data":${this.data}}`
  }

  validateKey () {
    if (this.key.length > KEY_LENGTH_LIMIT$1) {
      throw new SigverError(SigverError.KEY_ERROR,
        `The key length exceeds the limit of ${KEY_LENGTH_LIMIT$1} characters`
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

const SseChannel = require('sse-channel');
const http = require('http');

const MAX_ID$1 = 2147483647; // int32 max value for id generation

const sse = new SseChannel({cors: {origins: ['*']}});
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
      if ((req.url.startsWith('/?') && req.method === 'GET') || (req.url === '/' && req.method === 'POST')) {
        sse.addClient(req, res, error => {
          try {
            if (error) {
              const err = new SigverError(SigverError.CROS_ERROR, error.message);
              console.log(err.message);
            } else {
              const ioMsg = new IOQueryString(req.url.substring(2).toString());

              if (ioMsg.isToOpen()) {
                open$1(res, ioMsg);
              } else if (ioMsg.isToJoin()) {
                join$1(res, ioMsg);
              } else if (ioMsg.isToTransmitToOpener()) {
                transmitToOpener$1(ioMsg);
              } else if (ioMsg.isToTransmitToJoining()) {
                transmitToJoining$1(ioMsg);
              }
            }
          } catch (err) {
            if (err.name !== 'SigverError') {
              console.log('Error which not a SigverError instance: ', err);
            } else if (err.code !== SigverError.JOINING_GONE[1]) {
              console.log(err.message);
              if (err.code >= SigverError.KEY_ERROR[1] && err.code < SigverError.KEY_FOR_JOIN_UNKNOWN[1]) {
                sse.send(IOQueryString.msgKeyIsNotOk(err.code, err.message), [res]);
              } else {
                sse.send(IOQueryString.msgError(err.code, err.message));
              }
            } else {
              sse.send(IOQueryString.msgJoiningUnavailable());
            }
            sse.removeClient(res);
          }
        });
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    this.server.listen(options.port, options.host, cb);
  }

  close (cb) {
    console.log('Server has stopped successfully');
    this.server.close(cb);
  }

}

function open$1 (res, ioMsg) {
  if (openers$1.has(ioMsg.key)) {
    throw new SigverError(SigverError.KEY_FOR_OPEN_EXISTS, `The key ${ioMsg.key} has already been used for open`)
  }
  res.$id = generateId();
  resps.set(res.$id, res);
  const opener = new Opener(res);
  sse.send(IOQueryString.msgKeyIsOk(res.$id), [res]);
  opener.onclose = closeEvt => openers$1.delete(ioMsg.key);
  openers$1.set(ioMsg.key, opener);
}

function join$1 (res, ioMsg) {
  if (!openers$1.has(ioMsg.key)) {
    throw new SigverError(SigverError.KEY_FOR_JOIN_UNKNOWN, 'Unknown key')
  }
  res.$id = generateId();
  resps.set(res.$id, res);
  const opener = openers$1.get(ioMsg.key);
  opener.addJoining(res);
  sse.send(IOQueryString.msgKeyIsOk(res.$id), [res]);
}

function transmitToJoining$1 (ioMsg) {
  const joiningSource = resps.get(Number.parseInt(ioMsg.myId, 10));
  if (joiningSource !== undefined) {
    if (!('$opener' in joiningSource)) {
      throw new SigverError(SigverError.TRANSMIT_BEFORE_OPEN, 'Transmitting data before open')
    }
    const joining = joiningSource.$opener.getJoining(ioMsg.id);
    if (joining === undefined) {
      throw new SigverError(SigverError.JOINING_GONE, 'Joining is no longer available')
    }
    sse.send(ioMsg.msgToJoining(), [joining.source]);
  }
}

function transmitToOpener$1 (ioMsg) {
  const openerSource = resps.get(Number.parseInt(ioMsg.myId, 10));
  if (openerSource !== undefined) {
    if (!('$joining' in openerSource)) {
      throw new SigverError(SigverError.TRANSMIT_BEFORE_JOIN, 'Transmitting data before join')
    }
    const opener = openerSource.$joining.opener;
    if (opener === undefined) {
      throw new SigverError(SigverError.OPENER_GONE, 'Opener is no longer available')
    }
    sse.send(ioMsg.msgToOpener(openerSource.$joining.id), [opener.source]);
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
      console.log(`Server is listening on: ws://${host}:${port}`);
    });
    break
  case 'sse':
    SSEServer.start({host, port}, () => {
      console.log(`Server is listening on: http://${host}:${port}`);
    });
    break
}

}());
