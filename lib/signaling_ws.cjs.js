'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

class SigverError {
  constructor(code, message) {
    Error.captureStackTrace(this, this.constructor);
    this.code = code;
    this.message = `${this.getCodeText()}=${this.code}: ${message}`;
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
      case SigverError.TRANSMIT_BEFORE_OPEN:
        return 'TRANSMIT_BEFORE_OPEN';
      case SigverError.TRANSMIT_BEFORE_JOIN:
        return 'TRANSMIT_BEFORE_JOIN';
      case SigverError.CROS_ERROR:
        return 'CROSS_ORIGIN_RESOURCE_SHARING_ERROR';
      case SigverError.AUTH_ERROR:
        return 'AUTHENTICATION_ERROR';
      default:
        throw new Error('Unknown SigverError code');
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

  get key() {
    return this._openKey ? this._openKey : this._joinKey;
  }

  static msgUnavailable(id) {
    return id ? `{"unavailable":"${id}"}` : `{"unavailable":"0"}`;
  }

  static msgFirst(first) {
    return `{"first":${first}}`;
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

const openersMap = new Map();

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
      }
    }, err => {
      console.log('ServerCore init: ' + channel.id + ' | ' + err.message);
      this.clean(channel);
    }, () => this.clean(channel));
  }

  open(channel, ioMsg) {
    channel.key = ioMsg.key;
    const openers = openersMap.get(ioMsg.key);
    if (openers !== undefined) {
      openers.add(channel);
      channel.send(IOJsonString.msgFirst(false));
    } else {
      const setOfOpeners = new Set();
      setOfOpeners.add(channel);
      openersMap.set(ioMsg.key, setOfOpeners);
      channel.send(IOJsonString.msgFirst(true));
    }
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
    if (channel.key !== undefined) {
      const setOfOpeners = openersMap.get(channel.key);
      setOfOpeners.delete(channel);
      if (setOfOpeners.size === 0) {
        openersMap.delete(channel.key);
      }
    }
  }

  selectOpener(key) {
    const openers = openersMap.get(key);
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
