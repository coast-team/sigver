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
Message is a JSON string.

### Income messages
#### From peer who triggered connection
- When you wants to establish a connection with someone (you need to provide him this `key`).
```json
 {"key": "[some unique key]"}
```
- When you wants to send the `answer` to the previously received `offer`.
```json
 {"answer": "[some WebRTC data]"}
```


#### From peer wishing to connect
- When you wants to connect to the person who gave you the `key`.
```json
{"joinkey": "[key provided by the peer who triggered connection]"}
```
- When you wants to send the `offer` in order to establish a connection.
```json
 {"offer": "[some WebRTC data]"}
```

### Outcome messages
#### To peer who triggered connection
- Server forwards the `offer` (there is no data check) from someone who has the `key`.
```json
 {"offer": "[some WebRTC data]"}
```

#### To peer wishing to connect
- Server sends this message to you if the provided `key` is available, otherwise it closes the connection with `POLICY_VIOLATION` close event code.
```json
{"reachable": "true"}
```
- Server forwardsthe `answer` (there is no data check) to the previously sent `offer`.
```json
 {"answer": "[some WebRTC data]"}
```
