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

  // Before starting transmit data, the first request should be either 'open' or 'join'.
  static get TRANSMIT_BEFORE_OPEN() {
    return 4010;
  }
  static get TRANSMIT_BEFORE_JOIN() {
    return 4011;
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
    } else if ('data' in msg && keysNb === 1) {
      this.data = JSON.stringify(msg.data);
    } else if ('id' in msg && 'data' in msg && keysNb === 2) {
      this.validateId(msg.id);
      this.data = JSON.stringify(msg.data);
      this.id = msg.id;
    } else {
      throw new SigverError(SigverError.MESSAGE_ERROR, 'Unknown message');
    }
  }

  isToOpen() {
    return this._openKey !== undefined;
  }

  isToJoin() {
    return this._joinKey !== undefined;
  }

  isToTransmitToOpener() {
    return this.id === undefined;
  }

  isToTransmitToJoining() {
    return this.id !== undefined;
  }

  get key() {
    return this._openKey ? this._openKey : this._joinKey;
  }

  static msgUnavailable(id) {
    return id ? `{"unavailable":${id}}` : `{"unavailable":-1}`;
  }

  static msgOpened(opened) {
    return `{"opened":${opened}}`;
  }

  msgToJoining() {
    return `{"data":${this.data}}`;
  }

  msgToOpener(id) {
    return `{"id":${id},"data":${this.data}}`;
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
    if (typeof id !== 'number') {
      throw new SigverError(SigverError.MESSAGE_ERROR, `The joining id is not a number`);
    }
  }

}

class Joining {
  constructor(source, opener, id) {
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

  get opened() {
    if ('readyState' in this.source && 'OPEN' in this.source) {
      return this.source.readyState === this.source.OPEN;
    } else {
      return this._opened;
    }
  }
}

const MAX_ID = 2147483647; // int32 max value for id generation

class Opener {
  constructor(source) {
    source.$opener = this;
    this.source = source;
    this.joinings = new Map();
    this.onclose = () => {};
    this._opened = true;

    this.source.onclose = closeEvt => {
      this._opened = false;
      this.onclose();
      this.joinings.forEach(j => {
        j.opener = undefined;
      });
    };
  }

  get opened() {
    if ('readyState' in this.source && 'OPEN' in this.source) {
      return this.source.readyState === this.source.OPEN;
    } else {
      return this._opened;
    }
  }

  getJoining(id) {
    return this.joinings.get(id);
  }

  addJoining(source) {
    const id = this.generateId();
    const joining = new Joining(source, this, id);
    this.joinings.set(id, joining);
    return joining;
  }

  deleteJoining(joining) {
    this.joinings.delete(joining.id);
  }

  generateId() {
    let id;
    do {
      id = Math.ceil(Math.random() * MAX_ID);
      if (this.joinings.has(id)) continue;
      break;
    } while (true);
    return id;
  }
}

const openers = new Map();

/**
 * The core of the signaling server (WebSocket and SSE) containing the main logic
 */
class ServerCore {

  constructor() {
    this.server = null;
  }

  handleMessage(source, ioMsg) {
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

  open(source, ioMsg) {
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

  join(source, ioMsg) {
    openers.get(ioMsg.key).values().next().value.addJoining(source);
    source.send(IOJsonString.msgOpened(false));
  }

  transmitToJoining(source, ioMsg) {
    if (!('$opener' in source)) {
      throw new SigverError(SigverError.TRANSMIT_BEFORE_OPEN, 'Transmitting data before open');
    }
    const joining = source.$opener.getJoining(ioMsg.id);
    if (joining === undefined || !joining.opened) {
      source.$opener.source.send(IOJsonString.msgUnavailable(ioMsg.id));
    }
    joining.source.send(ioMsg.msgToJoining());
  }

  transmitToOpener(source, ioMsg) {
    if (!('$joining' in source)) {
      throw new SigverError(SigverError.TRANSMIT_BEFORE_JOIN, 'Transmitting data before join');
    }
    const opener = source.$joining.opener;
    if (opener === undefined || !opener.opened) {
      source.$joining.source.send(IOJsonString.msgUnavailable());
    }
    opener.source.send(ioMsg.msgToOpener(source.$joining.id));
  }

  close(cb) {
    if (this.server !== null) {
      console.log('Server has stopped successfully');
      this.server.close(cb);
    }
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
