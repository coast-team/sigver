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

## Install
```shell
npm install -g sigver
```

Sigver is built on top of [µWebSockets](https://github.com/uNetworking/uWebSockets) server. µWebSockets will try te recompile itself during installation. If this fails it will silently fall back to using the precompiled binaries. If this fails too, then please check the project's repository.

## Run
```shell
Usage: server [options]

Signaling server for WebRTC. Used by Netflux API (https://coast-team.github.io/netflux/)


Options:

  -V, --version           output the version number
  -h, --host <ip>         Select host address to bind to. (default: 0.0.0.0)
  -p, --port <number>     Select port to use. (default: 8000)
  -k, --key <file path>   Private key for the certificate
  -c, --cert <file path>  The server certificate
  -a, --ca <file path>    The additional intermediate certificate or certificates that web browsers will need in order to validate the server certificate.
  -h, --help              output usage information

Examples:

   $ sigver                       # Server is listening on ws://0.0.0.0:8000
   $ sigver -h 192.168.0.1 -p 80  # Server is listening on ws://192.168.0.1:80
   $ sigver --key ./private.key --cert ./primary.crt --ca ./intermediate.crt --port 443  # Server is listening on wss://0.0.0.0:443
```

## How to use
Assuming that the server is listening on `wss://mysigver.org`, then the server only accepts
`wss://mysigver.org/:key` where **key** is any valid string less than 512 characters (key identifies peer-to-peer network). For example:

`wss://mysigver.org/Lt71z0rspEqBKoConPJpr3NoODiO0kgAtM3fYc3VLH`



## Server protocol
Server uses [Protocol Buffers](https://developers.google.com/protocol-buffers/) for encode/decode all messages.

```
syntax = "proto3";

message Message {
  oneof type {
    Content content = 1;

    // Server's response to the peer wanted to join a peer to peer network.
    // True if the first peer in the network.
    bool isFirst = 2; // Only outcoming message

    // Peer's response to the server when he joined the group
    // successfully and is ready to help other peers to join.
    bool stable = 3; // Only incoming

    // Server sends `heartbeat` message each 5 seconds and expects getting the
    // same message back. If after 3 tentatives still no response then close the
    // connection.
    bool heartbeat = 4;

    // Peer's request to try another group member for joining.
    bool tryAnother = 5; // Only incoming
  }
}

message Content {
  uint32 id = 1; // Peer id to route data.

  // Data to be transmitted to the sibling peer
  oneof type {
    bytes data = 2; // WebRTC data (in fact could be any array of bytes)
    bool isError = 3; // Indicating that error occurred and thus signaling unsubscribes from the problematic peer
    bool isEnd = 4; // Indicating that the peer finished to send all data to another peer
  }
}
```

Server may close the socket with the following codes:

- **ERR_KEY: 4001**               // Inappropriate key format (e.g. key too long)
- **ERR_HEARTBEAT = 4002**        // Heart-beats error
- **ERR_MESSAGE = 4003**          // Any error due to message: type, format etc.
- **ERR_BLOCKING_MEMBER** = 4004  // When only one member left in the group and new peers could not join via him.
