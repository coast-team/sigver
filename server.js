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

  static get MESSAGE_FORMAT_ERROR () { return ['MESSAGE_FORMAT_ERROR', 4000] }
  static get MESSAGE_UNKNOWN () { return ['MESSAGE_UNKNOWN', 4001] }
  static get KEY_TOO_LONG () { return ['KEY_TOO_LONG', 4010] }
  static get KEY_FORMAT_ERROR () { return ['KEY_FORMAT_ERROR', 4011] }
  static get KEY_FOR_OPEN_EXISTS () { return ['KEY_EXISTS', 4012] }
  static get KEY_FOR_JOIN_UNKNOWN () { return ['KEY_UNKNOWN', 4013] }
  static get OPENER_GONE () { return ['OPENER_NO_LONGER_AVAILABLE', 4020] }
  static get JOINING_GONE () { return ['JOINING_NO_LONGER_AVAILABLE', 4021] }
  static get TRANSMIT_BEFORE_OPEN () { return ['TRANSMIT_BEFORE_OPEN', 4022] }
  static get TRANSMIT_BEFORE_JOIN () { return ['TRANSMIT_BEFORE_JOIN', 4023] }
}

const KEY_LENGTH_LIMIT = 512;

class IOJsonString extends IO {

  constructor (data) {
    super();
    try {
      this.msg = JSON.parse(data);
    } catch (err) {
      throw new SigverError(
        SigverError.MESSAGE_FORMAT_ERROR,
        'The message is not a JSON string'
      )
    }
    this._key = undefined;
    this.open = false;
    this.transmitToOpener = false;
    this.join = false;
    this.transmitToJoining = false;
    const keysNb = Object.keys(this.msg).length;
    if (('open' in this.msg) && keysNb === 1) {
      this._key = this.msg.open;
      this.validateKey();
      this.open = true;
    } else if ('join' in this.msg && keysNb === 1) {
      this._key = this.msg.join;
      this.validateKey();
      this.join = true;
    } else if ('data' in this.msg && keysNb === 1) {
      this.transmitToOpener = true;
    } else if ('id' in this.msg && 'data' in this.msg && keysNb === 2) {
      if (typeof this.msg.id !== 'number') {
        throw new Error(`The id should be a number, but it is ${typeof this.msg.id} instead`)
      }
      this.transmitToJoining = true;
    } else {
      throw new SigverError(SigverError.MESSAGE_UNKNOWN, 'Unknown message')
    }
  }

  isToOpen () { return this.open }

  isToJoin () { return this.join }

  isToTransmitToOpener () { return this.transmitToOpener }

  isToTransmitToJoining () { return this.transmitToJoining }

  get key () { return this._key }

  get id () { return this.msg.id }

  get data () { return this.msg.data }

  static msgIsKeyOk (isOk) {
    return `{"isKeyOk":${isOk}}`
  }

  static msgJoiningUnavailable (id) {
    return `{"id":${id},"unavailable":"true"}`
  }

  msgToJoining () {
    return `{"data":"${this.data}"}`
  }

  msgToOpener (id) {
    return `{"id":${id},"data":"${this.data}"}`
  }

  validateKey () {
    if (this.key.length > KEY_LENGTH_LIMIT) {
      throw new SigverError(
        SigverError.KEY_TOO_LONG,
        `The key length exceeds the limit of ${KEY_LENGTH_LIMIT} characters`
      )
    }
    if (typeof this._key !== 'string') {
      throw new SigverError(
        SigverError.KEY_FORMAT_ERROR,
        `The key ${this._key} is not a string`
      )
    }
    if (this._key === '') {
      throw new SigverError(
        SigverError.KEY_FORMAT_ERROR,
        `The key ${this._key} is an empty string`
      )
    }
  }

}

class Joining {
  constructor (source, opener, id) {
    this.source = source;
    this.source.$joining = this;
    this.opener = opener;
    this.id = id;

    this.source.onclose = closeEvt => {
      if (this.opener) {
        this.opener.deleteJoining(this);
      }
    };
  }
}

const MAX_ID = 2147483647; // int32 max value for id generation

class Opener {
  constructor (source) {
    this.source = source;
    this.source.$opener = this;
    this.joinings = new Map();
    this.onclose = () => {};

    this.source.onclose = closeEvt => {
      this.onclose();
      this.joinings.forEach(j => { j.opener = undefined; });
    };
  }

  getJoining (id) {
    return this.joinings.get(id)
  }

  addJoining (source) {
    const id = this.generateId();
    const joining = new Joining(source, this, id);
    this.joinings.set(id, joining);
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
    throw new SigverError(SigverError.KEY_FOR_OPEN_EXISTS,
      `The key "${ioMsg.key}"" exists already`
    )
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

const program = require('commander');

let host = process.env.NODE_IP || '0.0.0.0';
let port = process.env.NODE_PORT || 8000;

program
  .version('8.0.1', '-v, --version')
  .option('-h, --host <n>', 'specify host (DEFAULT: process.env.NODE_IP || "localhost")')
  .option('-p, --port <n>', 'specify port (DEFAULT: process.env.NODE_PORT || 8000)')
  .on('--help', () => {
    console.log(
`  Examples:

     $ sigver
     $ sigver -h 192.168.0.1 -p 9000
`);
  })
  .parse(process.argv);

if (program.host) host = program.host;
if (program.port) port = program.port;

// Run server
WSServer.start({host, port}, () => {
  console.log(`Server is running on: ws://${host}:${port}`);
});

}());
