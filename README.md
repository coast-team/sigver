# <p align="center">Sigver</p>
<p align="center">
WebSocket signaling server for WebRTC. Used by  [Netflux](https://github.com/coast-team/netflux).
<p>

<p align="center">
  [![npm version](https://img.shields.io/npm/v/sigver.svg?style=flat-square)](https://www.npmjs.com/package/sigver)&nbsp;
  [![Build Status](https://travis-ci.org/coast-team/sigver.svg?branch=master)](https://travis-ci.org/coast-team/sigver)&nbsp;
  [![dependencies Status](https://david-dm.org/coast-team/sigver/status.svg)](https://david-dm.org/coast-team/sigver)&nbsp;
  [![devDependencies Status](https://david-dm.org/coast-team/sigver/dev-status.svg)](https://david-dm.org/coast-team/sigver?type=dev)<br />
  [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)&nbsp;
  [![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square)](http://commitizen.github.io/cz-cli/)
<p>

## Require
Node.js 6.x

## How to use
```sh
git clone https://github.com/coast-team/sigver.git
node sigver/server.js [options]
```

or

```sh
npm install -g sigver
sigver [options]
```
### Options
    -h, --help      output usage information
    -v, --version   output the version number
    -h, --host <n>  specify host (DEFAULT: process.env.NODE_IP || "0.0.0.0")
    -p, --port <n>  specify port (DEFAULT: process.env.NODE_PORT || 8000)

### Examples
```sh
sigver -h 192.168.0.1 -p 9000

sigver --port 8002

node sigver/server.js --host 192.168.0.1 -p 9000
```

## Protocol
Message is a JSON string. We call **Opener** a client who is waiting for
a WebRTC offer. He provides a key to the server and maintains the socket connection with him. And we call **Joining** a client who provides a key to the server as **Opener** does and the offer. If the key is valid (corresponds to one of the **Opener**'s keys), then **Opener** receives
the **Joining**'s offer and sends him the answer. Then **Opener** and **Joining**
transmit each other a few ice candidates via the server. Normally after the RTCDataChannel has been established between the **Opener** and the **Joining**, **Joining** closes the socket connection with the server.

### Server income messages
#### From **Opener**
- When you want to establish a connection with someone (you need to provide him the key and wait until he sends the `join` message to the server).
```json
 { "open": "[some unique key]" }
```
- When you want to forward `data` to the **Joining** identified by `id`.
```json
{ "id": "[identifier]", "data": "[answer, candidate...]" }
```


#### From **Joining**
- When you want to interchange WebRTC data with the **Opener** in order to establish an RTCDataChannel.
```json
{ "join": "[key provided by the peer who triggered connection]" }
```
- When you want to forward `data` to the **Opener**.
```json
 { "data": "[offer, candidate...]" }
```

### Server outcome messages
#### To **Opener** & **Joining**
- Response to ̀`{"open":...}` and `{"join":...}` messages.
```json
 { "isKeyOk": "[true|false]" }
```

#### To **Opener**
- Server forwards `data` from the **Joining** identified by `id`.
```json
 { "id": "[identifier of the peer wishing to join]",
   "data": "[offer, candidate]" }
```
- Server notifies **Opener** that the **Joining** identified by `id` is no longer available.
```json
 { "id": "[identifier of the unavailable peer]", "unavailable": "true" }
```

#### To **Joining**
- Server forwards `data` from the **Opener**.
```json
 { "data": "[answer, candidate]" }
```
