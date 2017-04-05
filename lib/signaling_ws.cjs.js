'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

class SigverError extends Error {
  constructor(code, message = '') {
    super();
    this.code = code;
    this.message = `${this.getCodeText()}: ${message}`;
    this.name = this.constructor.name;
  }

  // Unapropriate message format (e.g. message is not a valid JSON string).
  static get MESSAGE_ERROR() {
    return 4000;
  }

  // Unapropriate key format (e.g. key too long).
  static get KEY_ERROR() {
    return 4001;
  }

  // Pong message is not received during a certain delay.
  static get PING_ERROR() {
    return 4002;
  }

  static get RESPONSE_TIMEOUT_ERROR() {
    return 4003;
  }

  /*
   The Cross-Origin Resource Sharing error. Occurs when the request
   was cross-origin and did not validate against the provided
   CORS configuration.
   */
  static get CROS_ERROR() {
    return 4020;
  }

  /*
  The client did not authenticate before sending data
   */
  static get AUTH_ERROR() {
    return 4021;
  }

  getCodeText() {
    switch (this.code) {
      case SigverError.MESSAGE_ERROR:
        return 'MESSAGE_ERROR';
      case SigverError.KEY_ERROR:
        return 'KEY_ERROR';
      case SigverError.PING_ERROR:
        return 'PING_ERROR';
      case SigverError.RESPONSE_TIMEOUT_ERROR:
        return 'RESPONSE_TIMEOUT_ERROR';
      case SigverError.CROS_ERROR:
        return 'CROSS_ORIGIN_RESOURCE_SHARING_ERROR';
      case SigverError.AUTH_ERROR:
        return 'AUTHENTICATION_ERROR';
      default:
        return this.code;
    }
  }
}

const KEY_LENGTH_LIMIT = 512;

/**
 * Parser of the incoming messages and Builder for the outcoming messages. It treats only
 * JSON strings, otherwise throw an error.
 */
class IOJsonString {
  constructor(data) {
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
      throw new SigverError(SigverError.MESSAGE_ERROR, 'The message is not a JSON string');
    }
    const keysNb = Object.keys(msg).length;
    if ('open' in msg && keysNb === 1) {
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
        throw new SigverError(SigverError.MESSAGE_ERROR, 'Unknown message: ' + data);
      }
    } else if ('ping' in msg && msg.ping && keysNb === 1) {
      this.ping = true;
    } else if ('pong' in msg && msg.pong && keysNb === 1) {
      this.pong = true;
    } else {
      throw new SigverError(SigverError.MESSAGE_ERROR, 'Unknown message: ' + data);
    }
  }

  isToOpen() {
    return this._openKey !== undefined;
  }

  isToJoin() {
    return this._joinKey !== undefined;
  }

  isToTransmit() {
    return this.data !== undefined;
  }

  isPing() {
    return this.ping;
  }

  isPong() {
    return this.pong;
  }

  get key() {
    return this._openKey ? this._openKey : this._joinKey;
  }

  static msgUnavailable(id) {
    return id ? `{"unavailable":"${id}"}` : `{"unavailable":"0"}`;
  }

  static msgFirst(first) {
    return `{"first":${first}}`;
  }

  static msgPing() {
    return '{"ping":true}';
  }

  static msgPong() {
    return '{"pong":true}';
  }

  msgTransmit(id) {
    return id ? `{"id":"${id}","data":${this.data}}` : `{"data":${this.data}}`;
  }

  validateKey(key) {
    if (typeof key !== 'string') {
      throw new SigverError(SigverError.KEY_ERROR, `The key ${key} is not a string`);
    }
    if (key === '') {
      throw new SigverError(SigverError.KEY_ERROR, `The key ${key} is an empty string`);
    }
    if (key.length > KEY_LENGTH_LIMIT) {
      throw new SigverError(SigverError.KEY_ERROR, `The key length exceeds the limit of ${KEY_LENGTH_LIMIT} characters`);
    }
  }

  validateId(id) {
    if (typeof id !== 'string') {
      throw new SigverError(SigverError.MESSAGE_ERROR, `The joining id is not a string`);
    }
  }
}

const bunyan = require('bunyan');

const log = bunyan.createLogger({ name: 'sigver' });

const openersByKey = new Map();

/**
 * The core of the signaling server (WebSocket and SSE) containing the main logic
 */
class ServerCore {
  init(channel) {
    channel.subscribe(ioMsg => {
      if (ioMsg.isToOpen()) {
        this.open(channel, ioMsg);
      } else if (ioMsg.isToJoin()) {
        this.join(channel, ioMsg);
      } else if (ioMsg.isPing()) {
        channel.send(IOJsonString.msgPong());
      } else if (ioMsg.isPong()) {
        channel.pongReceived = true;
      }
    }, err => {
      log.error('ServerCore', { id: channel.id, isOpener: channel.key !== undefined, err });
      this.clean(channel);
    }, () => this.clean(channel));
    channel.startPing();
  }

  open(channel, ioMsg) {
    channel.init(ioMsg.key);
    let openers = openersByKey.get(ioMsg.key);
    if (openers !== undefined) {
      openers.add(channel);
    } else {
      openers = new Set();
      openers.add(channel);
      openersByKey.set(ioMsg.key, openers);
    }
    log.info('ADD Opener', { op: 'add', id: channel.id, key: channel.key, size: openers.size });
    channel.send(IOJsonString.msgFirst(true));
  }

  join(channel, ioMsg) {
    const opener = this.selectOpener(ioMsg.key);
    if (opener !== undefined) {
      opener.pipe(channel);
      channel.pipe(opener);
      channel.send(IOJsonString.msgFirst(false));
    } else {
      channel.send(IOJsonString.msgFirst(true));
    }
  }

  clean(channel) {
    channel.stopPing();
    if (channel.key !== undefined) {
      const openers = openersByKey.get(channel.key);
      if (openers.size === 1) {
        openersByKey.delete(channel.key);
      } else {
        openers.delete(channel);
      }
      log.info('DELETE Opener', { op: 'delete', id: channel.id, key: channel.key, size: openers.size });
    }
  }

  selectOpener(key) {
    const openers = openersByKey.get(key);
    if (openers === undefined) {
      return undefined;
    }
    return openers.values().next().value;
  }
}

/**
 * WebSocket server able to use ws or uws modules.
 */
class SignalingServer extends ServerCore {
  constructor(serverInstance) {
    super();
    this.server = serverInstance;

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

function run(serverInstance) {
  return new SignalingServer(serverInstance);
}

exports.run = run;
