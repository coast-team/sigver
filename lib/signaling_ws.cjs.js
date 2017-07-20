'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var $protobuf = require('protobufjs/minimal');

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

  static get PEER_UNAVAILABLE_ERROR() {
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
      case SigverError.PEER_UNAVAILABLE_ERROR:
        return 'PEER_UNAVAILABLE_ERROR';
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

    this._key = undefined;
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
      this._key = msg.open;
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
    return this._key !== undefined;
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
    return this._key;
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

/*eslint-disable block-scoped-var, no-redeclare, no-control-regex, no-prototype-builtins*/
const $Reader = $protobuf.Reader;
const $Writer = $protobuf.Writer;
const $util = $protobuf.util;

const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

const Incoming = $root.Incoming = (() => {

    function Incoming(properties) {
        if (properties) for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i) if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    Incoming.prototype.content = null;
    Incoming.prototype.joined = false;
    Incoming.prototype.ping = false;
    Incoming.prototype.pong = false;

    let $oneOfFields;

    Object.defineProperty(Incoming.prototype, "type", {
        get: $util.oneOfGetter($oneOfFields = ["content", "joined", "ping", "pong"]),
        set: $util.oneOfSetter($oneOfFields)
    });

    Incoming.create = function create(properties) {
        return new Incoming(properties);
    };

    Incoming.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.content != null && message.hasOwnProperty("content")) $root.Content.encode(message.content, writer.uint32(10).fork()).ldelim();
        if (message.joined != null && message.hasOwnProperty("joined")) writer.uint32(16).bool(message.joined);
        if (message.ping != null && message.hasOwnProperty("ping")) writer.uint32(24).bool(message.ping);
        if (message.pong != null && message.hasOwnProperty("pong")) writer.uint32(32).bool(message.pong);
        return writer;
    };

    Incoming.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length,
            message = new $root.Incoming();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.content = $root.Content.decode(reader, reader.uint32());
                    break;
                case 2:
                    message.joined = reader.bool();
                    break;
                case 3:
                    message.ping = reader.bool();
                    break;
                case 4:
                    message.pong = reader.bool();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    };

    return Incoming;
})();

const Outcoming = $root.Outcoming = (() => {

    function Outcoming(properties) {
        if (properties) for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i) if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    Outcoming.prototype.content = null;
    Outcoming.prototype.isFirst = false;
    Outcoming.prototype.ping = false;
    Outcoming.prototype.pong = false;

    let $oneOfFields;

    Object.defineProperty(Outcoming.prototype, "type", {
        get: $util.oneOfGetter($oneOfFields = ["content", "isFirst", "ping", "pong"]),
        set: $util.oneOfSetter($oneOfFields)
    });

    Outcoming.create = function create(properties) {
        return new Outcoming(properties);
    };

    Outcoming.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.content != null && message.hasOwnProperty("content")) $root.Content.encode(message.content, writer.uint32(10).fork()).ldelim();
        if (message.isFirst != null && message.hasOwnProperty("isFirst")) writer.uint32(16).bool(message.isFirst);
        if (message.ping != null && message.hasOwnProperty("ping")) writer.uint32(24).bool(message.ping);
        if (message.pong != null && message.hasOwnProperty("pong")) writer.uint32(32).bool(message.pong);
        return writer;
    };

    Outcoming.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length,
            message = new $root.Outcoming();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.content = $root.Content.decode(reader, reader.uint32());
                    break;
                case 2:
                    message.isFirst = reader.bool();
                    break;
                case 3:
                    message.ping = reader.bool();
                    break;
                case 4:
                    message.pong = reader.bool();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    };

    return Outcoming;
})();

const Content = $root.Content = (() => {

    function Content(properties) {
        if (properties) for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i) if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    Content.prototype.id = "";
    Content.prototype.data = $util.newBuffer([]);
    Content.prototype.isError = false;
    Content.prototype.isEnd = false;

    let $oneOfFields;

    Object.defineProperty(Content.prototype, "type", {
        get: $util.oneOfGetter($oneOfFields = ["data", "isError", "isEnd"]),
        set: $util.oneOfSetter($oneOfFields)
    });

    Content.create = function create(properties) {
        return new Content(properties);
    };

    Content.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.id != null && message.hasOwnProperty("id")) writer.uint32(10).string(message.id);
        if (message.data != null && message.hasOwnProperty("data")) writer.uint32(18).bytes(message.data);
        if (message.isError != null && message.hasOwnProperty("isError")) writer.uint32(24).bool(message.isError);
        if (message.isEnd != null && message.hasOwnProperty("isEnd")) writer.uint32(32).bool(message.isEnd);
        return writer;
    };

    Content.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length,
            message = new $root.Content();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.id = reader.string();
                    break;
                case 2:
                    message.data = reader.bytes();
                    break;
                case 3:
                    message.isError = reader.bool();
                    break;
                case 4:
                    message.isEnd = reader.bool();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    };

    return Content;
})();

/**
 * Parser of the incoming messages and Builder for the outcoming messages. It treats only
 * JSON strings, otherwise throw an error.
 */
class IOProtobuf {
  static decode(bytes) {
    return Incoming.decode(new Uint8Array(bytes));
  }

  static encode(msg) {
    return Outcoming.encode(Outcoming.create(msg)).finish();
  }
}

const bunyan = require('bunyan');

const log = bunyan.createLogger({
  name: 'sigver',
  level: 'trace'
});

const networks = new Map();

/**
 * The core of the signaling server (WebSocket and SSE) containing the main logic
 */
class ServerCore {
  init({ peer, key }) {
    const net = networks.get(key);
    log.debug('NEW PEER ', key);
    // Check whether first peer or not in the network identified by the key
    if (net !== undefined) {
      console.log('IS not FIRST');
      peer.connect(net.selectMember());
      peer.send(IOProtobuf.encode({ isFirst: false }));
    } else {
      const net = new Network(key, peer);
      networks.set(key, net);
      peer.send(IOProtobuf.encode({ isFirst: true }));
    }

    // Subscribe to peer messages
    peer.subscribe(msg => {
      switch (msg.type) {
        case 'joined':
          this.becomeMember(peer, msg);
          break;
        case 'ping':
          peer.send(IOProtobuf.encode({ pong: true }));
          break;
        case 'pong':
          peer.pongReceived = true;
          break;
      }
    }, err => {
      log.error('ServerCore', { id: peer.id, isOpener: peer.network !== undefined, err });
      peer.clean();
    }, () => peer.clean());

    // Start ping
    peer.startPing();
  }

  becomeMember(peer) {
    if (peer.network === undefined) {
      const net = networks.get(peer.key);
      if (net !== undefined) {
        net.addMember(peer);
      } else {
        log.warn('Uncommon Open; create new Network', { id: peer.id, key: peer.key });
        const net = new Network(peer.key, peer);
        networks.add(peer.key, net);
      }
      peer.send(IOProtobuf.encode({ isFirst: true }));
    } else {
      peer.send(IOProtobuf.encode({ isFirst: false }));
    }
  }
}

class Network {
  constructor(key, peer) {
    this.key = key;
    this.members = new Set();
    this.addMember(peer);
  }

  selectMember() {
    return this.members.values().next().value;
  }

  addMember(peer) {
    peer.network = this;
    this.members.add(peer);
    log.info('ADD Member', { id: peer.id, key: this.key, size: this.members.size });
  }

  removeMember(peer) {
    if (this.members.size === 1) {
      networks.delete(this.key);
      log.info('REMOVE Network', { id: peer.id, key: peer.key });
    } else {
      this.members.delete(peer);
      log.info('DELETE Member', { id: peer.id, key: peer.key });
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
