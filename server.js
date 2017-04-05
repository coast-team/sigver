#!/usr/bin/env node
(function () {
'use strict';

class SigverError extends Error {
  constructor (code, message = '') {
    super();
    this.code = code;
    this.message = `${this.getCodeText()}: ${message}`;
    this.name = this.constructor.name;
  }

  // Unapropriate message format (e.g. message is not a valid JSON string).
  static get MESSAGE_ERROR () { return 4000 }

  // Unapropriate key format (e.g. key too long).
  static get KEY_ERROR () { return 4001 }

  // Pong message is not received during a certain delay.
  static get PING_ERROR () { return 4002 }

  static get RESPONSE_TIMEOUT_ERROR () { return 4003 }

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
      case SigverError.PING_ERROR: return 'PING_ERROR'
      case SigverError.RESPONSE_TIMEOUT_ERROR: return 'RESPONSE_TIMEOUT_ERROR'
      case SigverError.CROS_ERROR: return 'CROSS_ORIGIN_RESOURCE_SHARING_ERROR'
      case SigverError.AUTH_ERROR: return 'AUTHENTICATION_ERROR'
      default: return this.code
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
    this.ping = false;
    this.pong = false;
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
    } else if ('data' in msg) {
      this.data = JSON.stringify(msg.data);
      if ('id' in msg && keysNb === 2) {
        this.validateId(msg.id);
        this.id = msg.id;
      } else if (keysNb !== 1) {
        throw new SigverError(SigverError.MESSAGE_ERROR, 'Unknown message: ' + data)
      }
    } else if ('ping' in msg && msg.ping && keysNb === 1) {
      this.ping = true;
    } else if ('pong' in msg && msg.pong && keysNb === 1) {
      this.pong = true;
    } else {
      throw new SigverError(SigverError.MESSAGE_ERROR, 'Unknown message: ' + data)
    }
  }

  isToOpen () { return this._openKey !== undefined }

  isToJoin () { return this._joinKey !== undefined }

  isToTransmit () { return this.data !== undefined }

  isPing () { return this.ping }

  isPong () { return this.pong }

  get key () { return this._openKey ? this._openKey : this._joinKey }

  static msgUnavailable (id) {
    return id ? `{"unavailable":"${id}"}` : `{"unavailable":"0"}`
  }

  static msgFirst (first) {
    return `{"first":${first}}`
  }

  static msgPing () {
    return '{"ping":true}'
  }

  static msgPong () {
    return '{"pong":true}'
  }

  msgTransmit (id) {
    return id ? `{"id":"${id}","data":${this.data}}` : `{"data":${this.data}}`
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
    if (typeof id !== 'string') {
      throw new SigverError(SigverError.MESSAGE_ERROR, `The joining id is not a string`)
    }
  }
}

const bunyan = require('bunyan');

const log = bunyan.createLogger({name: 'sigver'});

const PING_INTERVAL = 5000;
const shortid = require('shortid');

class Channel extends require('rxjs/Rx').Subject {
  constructor () {
    super();
    this.id = shortid.generate();
    this.subscriptionToOpener = undefined;
    this.key = undefined;
    this.send = undefined;
    this.timeout = undefined;
    this.pongReceived = false;
  }

  init (key) {
    this.key = key;
    if (this.subscriptionToOpener) {
      this.subscriptionToOpener.unsubscribe();
      this.subscriptionToOpener = undefined;
    }
  }

  startPing () {
    this.send(IOJsonString.msgPing());
    const timeout = setInterval(() => {
      if (!this.pongReceived) {
        this.error(new SigverError(SigverError.PING_ERROR));
        clearInterval(timeout);
      } else {
        this.pongReceived = false;
        this.send(IOJsonString.msgPing());
      }
    }, PING_INTERVAL);
  }

  stopPing () {
    if (this.timeout !== undefined) {
      clearInterval(this.timeout);
    }
  }

  pipe (channel) {
    if (this.key === undefined) {
      this.subscriptionToOpener = channel.filter(ioMsg => ioMsg.isToTransmit() && ioMsg.id === this.id)
        .subscribe(
          ioMsg => this.send(ioMsg.msgTransmit()),
          err => {
            log.error('Channel', { id: this.id, isOpener: false, subscribedToId: channel.id, err: err.message });
            this.send(IOJsonString.msgUnavailable(channel.id));
          },
          () => this.send(IOJsonString.msgUnavailable(channel.id))
        );
    } else {
      channel.filter(ioMsg => ioMsg.isToTransmit())
        .subscribe(
          ioMsg => this.send(ioMsg.msgTransmit(channel.id)),
          err => {
            log.error('Channel', { id: this.id, isOpener: true, subscribedToId: channel.id, err: err.message });
            if (err.code && err.code === SigverError.RESPONSE_TIMEOUT_ERROR) {
              this.error(err);
            } else {
              this.send(IOJsonString.msgUnavailable(channel.id));
            }
          },
          () => this.send(IOJsonString.msgUnavailable(channel.id))
        );
    }
  }
}

/**
 * WebSocket server able to use ws or uws modules.
 */
class WsServer {
  constructor () {
    const Subject = require('rxjs/Rx').Subject;
    this.onChannel = new Subject();
  }

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

    this.server.on('error', err => {
      console.error(`Server error: ${err}`);
      this.onChannel.error(err);
    });

    this.server.on('connection', socket => {
      const channel = new Channel(socket);
      socket.onmessage = evt => {
        try {
          channel.next(new IOJsonString(evt.data));
        } catch (err) {
          socket.close(err.code, err.message);
        }
      };
      socket.onerror = err => channel.error(err);
      socket.onclose = closeEvt => {
        if (closeEvt.code === 1000) {
          channel.complete();
        } else {
          channel.error(new SigverError(closeEvt.code, closeEvt.reason));
        }
      };
      channel.send = msg => socket.send(msg);
      channel.close = (code, reason) => socket.close(code, reason);
      this.onChannel.next(channel);
    });
  }

  close (cb) {
    if (this.server !== null) {
      console.log('Server has stopped successfully');
      this.server.close(cb);
      this.onChannel.complete();
    }
  }
}

const openersByKey = new Map();

/**
 * The core of the signaling server (WebSocket and SSE) containing the main logic
 */
class ServerCore {
  init (channel) {
    channel.subscribe(
      ioMsg => {
        if (ioMsg.isToOpen()) {
          this.open(channel, ioMsg);
        } else if (ioMsg.isToJoin()) {
          this.join(channel, ioMsg);
        } else if (ioMsg.isPing()) {
          channel.send(IOJsonString.msgPong());
        } else if (ioMsg.isPong()) {
          channel.pongReceived = true;
        }
      },
      err => {
        log.error('ServerCore', { id: channel.id, isOpener: channel.key !== undefined, err });
        this.clean(channel);
      },
      () => this.clean(channel)
    );
    channel.startPing();
  }

  open (channel, ioMsg) {
    channel.init(ioMsg.key);
    let openers = openersByKey.get(ioMsg.key);
    if (openers !== undefined) {
      openers.add(channel);
    } else {
      openers = new Set();
      openers.add(channel);
      openersByKey.set(ioMsg.key, openers);
    }
    log.info('ADD Opener', {op: 'add', id: channel.id, key: channel.key, size: openers.size});
    channel.send(IOJsonString.msgFirst(true));
  }

  join (channel, ioMsg) {
    const opener = this.selectOpener(ioMsg.key);
    if (opener !== undefined) {
      opener.pipe(channel);
      channel.pipe(opener);
      channel.send(IOJsonString.msgFirst(false));
    } else {
      channel.send(IOJsonString.msgFirst(true));
    }
  }

  clean (channel) {
    channel.stopPing();
    if (channel.key !== undefined) {
      const openers = openersByKey.get(channel.key);
      if (openers.size === 1) {
        openersByKey.delete(channel.key);
      } else {
        openers.delete(channel);
      }
      log.info('DELETE Opener', {op: 'delete', id: channel.id, key: channel.key, size: openers.size});
    }
  }

  selectOpener (key) {
    const openers = openersByKey.get(key);
    if (openers === undefined) {
      return undefined
    }
    return openers.values().next().value
  }
}

// import SseServer from './SseServer'
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

const core = new ServerCore();

switch (type) {
  case 'ws': {
    const wsServer = new WsServer();
    wsServer.onChannel.subscribe(channel => core.init(channel),
      (err) => console.log('my errorerlsj: ' + err));
    wsServer.start({host, port}, () => {
      console.log(`WebSocket server is listening on: ws://${host}:${port}`);
    }, {wsLib});
    break
  }
  // case 'sse': {
  //   const sseServer = new SseServer()
  //   sseServer.start({host, port}, () => {
  //     console.log(`EventSource server is listening on: http://${host}:${port}`)
  //   })
  //   break
  // }
}

}());
