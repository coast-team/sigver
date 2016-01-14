# Sigver
[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)&nbsp;
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)&nbsp;
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square)](http://commitizen.github.io/cz-cli/)&nbsp;

[![npm](https://img.shields.io/npm/v/sigver.svg)](https://www.npmjs.com/package/sigver)&nbsp;
[![Build Status](https://travis-ci.org/coast-team/sigver.svg?branch=master)](https://travis-ci.org/coast-team/sigver)
[![Dependency Status](https://david-dm.org/coast-team/sigver.svg)](https://david-dm.org/coast-team/sigver)&nbsp;
[![devDependency Status](https://david-dm.org/coast-team/sigver/dev-status.svg)](https://david-dm.org/coast-team/sigver#info=devDependencies)

Very simple signaling server based on WebSocket to test WebRTC.

## Run
Server runs on `ws://localhost:8080`
```
node server.js
```

## Message protocol
Message is a JSON string.

### Income messages
#### From peer who triggered connection
```json
{"type": "open",
 "id": "[identifier of a peer who triggered connection]"}
```
```json
{"type": "icecandidate",
 "index": "[identifier of a peer who triggered connection]",
 "data": "[SDP]"}
```
```json
{"type": "offer",
 "index": "[index of the recipient peer]",
 "data": "[SDP]"}
```

#### From peer wishing to connect
```json
{"type": "join",
 "id": "[identifier of a peer who triggered connection]"}
```
```json
{"type": "icecandidate",
 "data": "[SDP]"}
```
```json
{"type": "offer",
 "data": "[SDP]"}
```

### Outcome messages
#### To peer who triggered connection
```json
{"type": "join"}
```
```json
{"type": "icecandidate",
 "index": "[index of a connecting peer]",
 "data": "[SDP]"}
```
```json
{"type": "offer",
 "index": "[index of a connecting peer]",
 "data": "[SDP]"}
```

#### To peer wishing to connect
```json
{"type": "icecandidate",
 "data": "[SDP]"}
```
```json
{"type": "offer",
 "data": "[SDP]"}
```
