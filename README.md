# [![NPM](https://nodei.co/npm/sigver.png)](https://nodei.co/npm/sigver/) [![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)&nbsp;
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square)](http://commitizen.github.io/cz-cli/)&nbsp;

[![npm](https://img.shields.io/npm/v/sigver.svg)](https://www.npmjs.com/package/sigver)&nbsp;
[![Build Status](https://travis-ci.org/coast-team/sigver.svg?branch=master)](https://travis-ci.org/coast-team/sigver)
[![Dependency Status](https://david-dm.org/coast-team/sigver.svg)](https://david-dm.org/coast-team/sigver)&nbsp;
[![devDependency Status](https://david-dm.org/coast-team/sigver/dev-status.svg)](https://david-dm.org/coast-team/sigver#info=devDependencies)

Very simple signaling server based on WebSocket to test WebRTC.

## How to use
For Node 6 and above:
```
node server.js [OPTIONS]
```
For the previous versions of node (this by default for `npm start`):
```
node server.es5.js [OPTIONS]
```
-h, --host
 - Specify host for the server. `localhost` by default.

-p, --port
 - Specify port for the server. `8000` by default.

## Message protocol
Message is a JSON string.

### Income messages
#### From peer who triggered connection
- When you wants to establish a connection with someone (you need to provide him this `key`).
```json
 {"key": "[some unique key]"}
```
- When you wants to forward `data` to the peer identified by `id`.
```json
{"id": "[identifier]",
   "data": "[any data]"}
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
#### To peer who triggered connection
- Server forwards `data` from a peer identified by `id`.
```json
 {"id": "[identifier of the peer wishing to join]",
   "data": "[some data]"}
```
- Server notify that the peer with `id` is no longer available.
```json
 {"id": "[identifier of the unavailable peer]",
   "unavailable": "true"}
```

#### To peer wishing to connect
- Server forwards `data`.
```json
 {"data": "[some data]"}
```
