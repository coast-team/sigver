# Sigver
[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)&nbsp;
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)&nbsp;
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square)](http://commitizen.github.io/cz-cli/)&nbsp;

[![npm](https://img.shields.io/npm/v/sigver.svg)](https://www.npmjs.com/package/sigver)&nbsp;
[![Build Status](https://travis-ci.org/coast-team/sigver.svg?branch=master)](https://travis-ci.org/coast-team/sigver)
[![Dependency Status](https://david-dm.org/coast-team/sigver.svg)](https://david-dm.org/coast-team/sigver)&nbsp;
[![devDependency Status](https://david-dm.org/coast-team/sigver/dev-status.svg)](https://david-dm.org/coast-team/sigver#info=devDependencies)

Very simple signaling server based on WebSocket to test WebRTC.

## How to use
```
node server.js
```

## Message protocol
Message is a JSON string. When the `type` value is `icecandidate` or `offer` then the server forwards all additional attributes provided by a peer (usually it is some offer and/or icecandidate data).

### Income messages
#### From peer who triggered connection
```json
{"type": "open",
 "key": "[some key]"}
```
```json
{"type": "icecandidate",
 "index": "[index of the recipient peer]"}
```
```json
{"type": "offer",
 "index": "[index of the recipient peer]"}
```

#### From peer wishing to connect
```json
{"type": "join",
 "key": "[key provided by the peer who triggered connection]"}
```
```json
{"type": "icecandidate"}
```
```json
{"type": "offer"}
```

### Outcome messages
#### To peer who triggered connection
```json
{"type": "join"}
```
```json
{"type": "icecandidate",
 "index": "[index of a connecting peer]"}
```
```json
{"type": "offer",
 "index": "[index of a connecting peer]"}
```

#### To peer wishing to connect
```json
{"type": "icecandidate"}
```
```json
{"type": "offer"}
```
