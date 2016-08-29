# [![NPM](https://nodei.co/npm/sigver.png)](https://nodei.co/npm/sigver/) [![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

[![Build Status](https://travis-ci.org/coast-team/sigver.svg?branch=master)](https://travis-ci.org/coast-team/sigver)&nbsp;
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)&nbsp;
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square)](http://commitizen.github.io/cz-cli/)&nbsp;

[![dependencies Status](https://david-dm.org/coast-team/sigver/status.svg)](https://david-dm.org/coast-team/sigver)&nbsp;
[![devDependencies Status](https://david-dm.org/coast-team/sigver/dev-status.svg)](https://david-dm.org/coast-team/sigver?type=dev)&nbsp;
[![optionalDependencies Status](https://david-dm.org/coast-team/sigver/optional-status.svg)](https://david-dm.org/coast-team/sigver?type=optional)

Very simple signaling server based on WebSocket to test WebRTC.

| [<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Node.js_logo.svg/32px-Node.js_logo.svg.png" alt="NodeJS" width="32px" height="20px" />](http://godban.github.io/browsers-support-badges/)</br>NodeJS |
| --------- |
| 4 and above


## How to use
    npm install -g sigver

### As command line tool
    Usage: sigver [options]

    Options:
      -h, --help      output usage information
      -v, --version   output the version number
      -h, --host <n>  specify host (DEFAULT: process.env.NODE_IP || "localhost")
      -p, --port <n>  specify port (DEFAULT: process.env.NODE_PORT || 8000)

    Examples:
      $ sigver
      $ sigver -h 192.168.0.1 -p 9000

### As library
```javascript
const sigver = require('sigver')

/**
 * Start the server
 * @param {string} host
 * @param {number} port
 * @param {callback} onStart
 */
sigver.start(host, port,
  onStart: () => {

    // Do something...

    sigver.stop()
  }
)
```


## Protocol
Message is a JSON string.

### Income messages
#### From peer who triggered connection
- When you want to establish a connection with someone (you need to provide him this `key` and wait until he send the `join` message to the server).
```json
 {"key": "[some unique key]"}
```
- When you wants to forward `data` to the peer identified by `id`.
```json
{"id": "[identifier]", "data": "[any data]"}
```


#### From peer wishing to connect
- When you wants to connect to the person who gave you the `key` (if `data` attribute is present, it will be forwarded).
```json
{"join": "[key provided by the peer who triggered connection]",
   "data": "[any data]"}
```
- When you wants to forward `data` to the peer.
```json
 {"data": "[any data]"}
```

### Outcome messages
- Responce to ̀`{"key":...}` and `{"join":...}` messages.
```json
 {"isKeyOk": "[true|false]"}
```
#### To peer who triggered connection
- Server forwards `data` from a peer identified by `id`.
```json
 {"id": "[identifier of the peer wishing to join]",
   "data": "[some data]"}
```
- Server notify that the peer with `id` is no longer available.
```json
 {"id": "[identifier of the unavailable peer]", "unavailable": "true"}
```

#### To peer wishing to connect
- Server forwards `data`.
```json
 {"data": "[some data]"}
```
