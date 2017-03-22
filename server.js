#!/usr/bin/env node
(function () {
'use strict';

class SigverError {
  constructor (code, message) {
    Error.captureStackTrace(this, this.constructor);
    this.code = code;
    this.message = `${this.getCodeText()}=${this.code}: ${message}`;
    this.name = this.constructor.name;
  }

  // Unapropriate message format (e.g. message is not a valid JSON string).
  static get MESSAGE_ERROR () { return 4000 }

  // Unapropriate key format (e.g. key too long).
  static get KEY_ERROR () { return 4001 }

  // Before starting transmit data, the first request should be either 'open' or 'join'.
  static get TRANSMIT_BEFORE_OPEN () { return 4010 }
  static get TRANSMIT_BEFORE_JOIN () { return 4011 }

  /*
   The Cross-Origin Resource Sharing error. Occurs when the request
   was cross-origin and did not validate against the provided
   CORS configuration.
   */
  static get CROS_ERROR () { return 4020 }

  /*
  The client did not authenticate before sending data
   */
  static get AUTH_ERROR () { return 4021 }

  getCodeText () {
    switch (this.code) {
      case SigverError.MESSAGE_ERROR: return 'MESSAGE_ERROR'
      case SigverError.KEY_ERROR: return 'KEY_ERROR'
      case SigverError.TRANSMIT_BEFORE_OPEN: return 'TRANSMIT_BEFORE_OPEN'
      case SigverError.TRANSMIT_BEFORE_JOIN: return 'TRANSMIT_BEFORE_JOIN'
      case SigverError.CROS_ERROR: return 'CROSS_ORIGIN_RESOURCE_SHARING_ERROR'
      case SigverError.AUTH_ERROR: return 'AUTHENTICATION_ERROR'
      default: throw new Error('Unknown SigverError code')
    }
  }
}

const KEY_LENGTH_LIMIT = 512;

/**
 * Parser of the incoming messages and Builder for the outcoming messages. It treats only
 * JSON strings, otherwise throw an error.
 */
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
      this.validateKey(msg.open);
      this._openKey = msg.open;
    } else if ('join' in msg && keysNb === 1) {
      this.validateKey(msg.join);
      this._joinKey = msg.join;
    } else if ('data' in msg && keysNb === 1) {
      this.data = JSON.stringify(msg.data);
    } else if ('id' in msg && 'data' in msg && keysNb === 2) {
      this.validateId(msg.id);
      this.data = JSON.stringify(msg.data);
      this.id = msg.id;
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

  validateKey (key) {
    if (typeof key !== 'string') {
      throw new SigverError(SigverError.KEY_ERROR, `The key ${key} is not a string`)
    }
    if (key === '') {
      throw new SigverError(SigverError.KEY_ERROR, `The key ${key} is an empty string`)
    }
    if (key.length > KEY_LENGTH_LIMIT) {
      throw new SigverError(SigverError.KEY_ERROR,
        `The key length exceeds the limit of ${KEY_LENGTH_LIMIT} characters`
      )
    }
  }

  validateId (id) {
    if (typeof id !== 'number') {
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
    this._opened = true;
    this.source.onclose = closeEvt => {
      this._opened = false;
      if (this.opener) {
        this.opener.deleteJoining(this);
      }
    };
  }

  get opened () {
    if ('readyState' in this.source && 'OPEN' in this.source) {
      return this.source.readyState === this.source.OPEN
    } else {
      return this._opened
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
    this._opened = true;

    this.source.onclose = closeEvt => {
      this._opened = false;
      this.onclose();
      this.joinings.forEach(j => { j.opener = undefined; });
    };
  }

  get opened () {
    if ('readyState' in this.source && 'OPEN' in this.source) {
      return this.source.readyState === this.source.OPEN
    } else {
      return this._opened
    }
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

const openers = new Map();

/**
 * The core of the signaling server (WebSocket and SSE) containing the main logic
 */
class ServerCore {

  constructor () {
    this.server = null;
  }

  handleMessage (source, ioMsg) {
    if (ioMsg.isToOpen()) {
      this.open(source, ioMsg);
    } else if (ioMsg.isToJoin()) {
      // While trying to join, if the key exists, then join. If the key does
      // not exist, then do as if the client want to open.
      if (openers.has(ioMsg.key)) {
        this.join(source, ioMsg);
      } else {
        this.open(source, ioMsg);
      }
    } else if (ioMsg.isToTransmitToOpener()) {
      this.transmitToOpener(source, ioMsg);
    } else if (ioMsg.isToTransmitToJoining()) {
      this.transmitToJoining(source, ioMsg);
    }
  }

  open (source, ioMsg) {
    const opener = new Opener(source);
    if (openers.has(ioMsg.key)) {
      openers.get(ioMsg.key).add(opener);
    } else {
      const setOfOpeners = new Set();
      setOfOpeners.add(opener);
      openers.set(ioMsg.key, setOfOpeners);
    }
    source.send(IOJsonString.msgOpened(true));
    opener.onclose = closeEvt => {
      const setOfOpeners = openers.get(ioMsg.key);
      setOfOpeners.delete(opener);
      if (setOfOpeners.size === 0) {
        openers.delete(ioMsg.key);
      }
    };
  }

  join (source, ioMsg) {
    openers.get(ioMsg.key).values().next().value.addJoining(source);
    source.send(IOJsonString.msgOpened(false));
  }

  transmitToJoining (source, ioMsg) {
    if (!('$opener' in source)) {
      throw new SigverError(SigverError.TRANSMIT_BEFORE_OPEN, 'Transmitting data before open')
    }
    const joining = source.$opener.getJoining(ioMsg.id);
    if (joining === undefined || !joining.opened) {
      source.$opener.source.send(IOJsonString.msgUnavailable(ioMsg.id));
    }
    joining.source.send(ioMsg.msgToJoining());
  }

  transmitToOpener (source, ioMsg) {
    if (!('$joining' in source)) {
      throw new SigverError(SigverError.TRANSMIT_BEFORE_JOIN, 'Transmitting data before join')
    }
    const opener = source.$joining.opener;
    if (opener === undefined || !opener.opened) {
      source.$joining.source.send(IOJsonString.msgUnavailable());
    }
    opener.source.send(ioMsg.msgToOpener(source.$joining.id));
  }

  close (cb) {
    if (this.server !== null) {
      console.log('Server has stopped successfully');
      this.server.close(cb);
    }
  }
}

/**
 * WebSocket server able to use ws or uws modules.
 */
class WsServer extends ServerCore {
  /**
   * Start the server.
   * @param {Object} options Options to be passed to ws or uws module
   * @param {Function} cb Callback to execute after the server has been started
   * @param {Object} [extraOptions]
   * @param {string} extraOptions.wsLib Specify which module to use (ws or uws)
   */
  start (options, cb = () => {}, extraOptions) {
    const defaultOptions = {
      perMessageDeflate: false
    };
    const settings = Object.assign({}, defaultOptions, options);
    let WebSocket = {};
    try {
      WebSocket = require(extraOptions.wsLib);
      console.log(`${extraOptions.wsLib} module is used for WebSocket server`);
    } catch (err) {
      const anotherLib = extraOptions.wsLib === 'uws' ? 'ws' : 'uws';
      console.log(`INFO: ${err.message}. Will use ${anotherLib} instead`);
      try {
        WebSocket = require(anotherLib);
      } catch (err2) {
        console.log(`ERROR: ${err2.message}. Thus the WebSocket server cannot be run`);
      }
    }
    const WebSocketServer = WebSocket.Server;

    // Starting server
    this.server = new WebSocketServer(settings, cb);

    this.server.on('error', err => console.error(`Server error: ${err}`));

    this.server.on('connection', socket => {
      socket.onerror = err => {
        console.log(`Socket error while sending ${err.code}: ${err.reason}`);
      };
      socket.onmessage = msgEvent => {
        try {
          // Handle client message
          super.handleMessage(socket, new IOJsonString(msgEvent.data));
        } catch (err) {
          if (err.name !== 'SigverError') {
            console.log(`WebSocketServer: Error which not a SigverError instance: : ${err.message}`, err.stack);
          } else {
            console.log(err.message);
            socket.close(err.code, err.message);
          }
        }
      };
    });
  }
}

/**
 * A wrapper around ServerResponse object to simulate Socket API.
 */
class SseResponseWrapper {
  constructor (id, sse, res) {
    this.id = id;
    this.sse = sse;
    this.res = res;
    this.res.$channel = this;
    this.onclose = () => {};
  }

  close () {
    this.onclose();
  }

  send (msg) {
    this.sse.send(msg, [this.res]);
  }

}

let SseChannel = {};
try {
  SseChannel = require('sse-channel');
} catch (err) {
  console.log('INFO: sse-channel module is not installed properly, thus EventSource server cannot be run');
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
  if ('$channel' in res) {
    res.$channel.close();
  } else {
    throw new Error('Error on sse client disconnect. This should not be happend, check usage of sse.addClient')
  }
});
const resps = new Map();

/**
 * Server-Sent-Event server. Client should use EventSource API together
 * with Ajax (Fetch or XMLHttpRequest API for example). EventSource is
 * used for server to notify client and Ajax is used by client to send
 * data to the server.
 */
class SseServer extends ServerCore {

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
                console.log('SseServer: ' + new SigverError(SigverError.CROS_ERROR, err.message).message);
              } else {
                const sseChannel = new SseResponseWrapper(generateId(), sse, res);
                resps.set(sseChannel.id, sseChannel);
                sseChannel.send({event: 'auth', data: sseChannel.id});
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
              let resWrapper;
              try {
                const separator = body.indexOf('@');
                resWrapper = resps.get(Number.parseInt(body.substring(0, separator), 10));
                if (resWrapper === undefined) {
                  throw new SigverError(SigverError.AUTH_ERROR, 'Send message before authentication')
                }
                const data = body.substring(separator + 1);

                super.handleMessage(resWrapper, new IOJsonString(data));
              } catch (err) {
                if (err.name !== 'SigverError') {
                  console.log(`SseServer: Error is not a SigverError instance: ${err.message}`);
                } else {
                  console.log(`SseServer: ${err.message}`);
                }
                if (resWrapper !== undefined) {
                  resWrapper.send({
                    event: 'close',
                    data: JSON.stringify({ code: err.code, reason: err.message })
                  });
                  sse.removeClient(resWrapper.res);
                }
              } finally {
                res.writeHead(200, {'Access-Control-Allow-Origin': req.headers.origin});
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
}

function res404 (res, origin) {
  res.writeHead(404, {'Access-Control-Allow-Origin': origin});
  res.end();
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
let wsLib = 'uws';

program
  .version('8.1.0', '-v, --version')
  .option('-h, --host <n>', 'Select host address to bind to, DEFAULT: process.env.NODE_IP || "0.0.0.0"')
  .option('-p, --port <n>', 'Select port to use, DEFAULT: process.env.NODE_PORT || 8000\n')
  .option('-t, --type <value>',
`Specify the server type. The possible values are:
    ws - for WebSocket only ("ws://host:port"). This is DEFAULT
    sse - for Server-Sent-Event only ("http://host:port")
`)
  .option('-w, --wsLib <value>',
`Available only when the option -t/--type is equal to ws. Specify the server module to use for WebSocket server. The possible values are:
    ws - https://github.com/websockets/ws
    uws - https://github.com/uWebSockets/uWebSockets. This is DEFAULT, if the module has not been installed properly or no binary is available for the current OS, then ws will be used instead`)
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
if (program.wsLib) wsLib = program.wsLib;

switch (type) {
  case 'ws': {
    const wsServer = new WsServer();
    wsServer.start({host, port}, () => {
      console.log(`WebSocket server is listening on: ws://${host}:${port}`);
    }, {wsLib});
    break
  }
  case 'sse': {
    const sseServer = new SseServer();
    sseServer.start({host, port}, () => {
      console.log(`EventSource server is listening on: http://${host}:${port}`);
    });
    break
  }
}

}());
