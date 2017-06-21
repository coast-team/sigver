# <p align="center">Sigver</p>
<p align="center">
Signaling server for WebRTC listening on <strong style="font-weight: bold">WebSocket</strong>.
<br />Used by <strong style="font-weight: bold">Netflux</strong>, Javascript client and server side transport API for creating a peer to peer network.
<p>
<p align="center">
  <a href="https://www.npmjs.com/package/sigver" target="_blank">
    <img src="https://img.shields.io/npm/v/sigver.svg?style=flat-square" />
  </a>
  <a href="">
    <img src="https://img.shields.io/node/v/sigver.svg?style=flat-square" />
  </a>
  <a href="https://travis-ci.org/coast-team/sigver" target="_blank">
    <img src="https://travis-ci.org/coast-team/sigver.svg?branch=master&style=flat-square" />
  </a>
  <a href="https://github.com/semantic-release/semantic-release" target="_blank">
    <img src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square" />
  </a>
  <a href="http://commitizen.github.io/cz-cli" target="_blank">
    <img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square" />
  </a>
<p>

## How to use
```sh
npm install -g sigver
sigver [options]
```

```shell
Options:

    -h, --help          output usage information
    -v, --version       output the version number
    -h, --host <n>      Select host address to bind to. Default: 0.0.0.0

    -p, --port <n>      Select port to use, Default: 8000

    -s, --secure        If present, server is listening on WSS instead of WS
    -k, --key <value>   Private key for the certificate
    -c, --cert <value>  The server certificate
    -a, --ca <value>    The additional intermediate certificate or certificates that web browsers will need in order to validate the server certificate.

Examples:

     $ sigver                         # Server is listening on ws://0.0.0.0:8000
     $ sigver -h 192.168.0.1 -p 9000  # Server is listening on ws://192.168.0.1:9000
     $ sigver -p 9000                 # Server is listening on http://0.0.0.0:9000
```

## Protocol for WebSocket server
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

## Protocol for Server-Sent-Event server

  Very similar to the WebSocket protocol, but has some significant differences.

  Discription to come...
