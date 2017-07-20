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
Connect to the server as for example `ws://mydomain.com/:key`, where `key` could be any valid string less then 512 characters. The following protocol is described from server perspective ([more about Protocol Buffers](https://developers.google.com/protocol-buffers/)).

```protobufjs
syntax = "proto3";

message Incoming {
  oneof type {
    Content content = 1;
    bool joined = 2;
    bool ping = 3;
    bool pong = 4;
  }
}

message Outcoming {
  oneof type {
    Content content = 1;
    bool isFirst = 2;
    bool ping = 3;
    bool pong = 4;
  }
}

message Content {
  uint32 id = 1;
  oneof type {
    bytes data = 2;
    bool isError = 3;
    bool isEnd = 4;
  }
}

```
