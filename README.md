# Sigver

WebRTC Signaling server based on **WebSocket** for [**Netflux API**](https://coast-team.github.io/netflux), Javascript client and server side transport API for establishing peer to peer network.

[![version](https://img.shields.io/npm/v/sigver.svg?style=flat-square)](https://www.npmjs.com/package/sigver)
[![node-version](https://img.shields.io/node/v/sigver.svg?style=flat-square)](https://nodejs.org/en/)

[![travis](https://travis-ci.org/coast-team/sigver.svg?branch=master&style=flat-square)](https://travis-ci.org/coast-team/sigver)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)
[![commitizen](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square)](http://commitizen.github.io/cz-cli)

## Install

```shell
npm install -g sigver
```

Sigver is built on top of [µWebSockets](https://github.com/uNetworking/uWebSockets) server. If you encounter any problem with its installation, please check the project's repository.

## Run

```shell
Usage: sigver [options]

Signaling server for WebRTC. Used by Netflux API (https://coast-team.github.io/netflux/)

Options:

  -V, --version           output the version number
  -h, --host <ip>         Select host address to bind to (default: 0.0.0.0)
  -p, --port <number>     Select port to use (default: 8000)
  -k, --key <file path>   Private key for the certificate.
  -c, --cert <file path>  The server certificate.
  -a, --ca <file path>    The additional intermediate certificate or certificates that web browsers will need in order to validate the server certificate.
  -h, --help              output usage information

Examples:

  $ sigver                       # Signaling server is listening on 0.0.0.0:8000
  $ sigver -h 192.168.0.1 -p 80  # Signaling server is listening on 192.168.0.1:80
  $ sigver --key ./private.key --cert ./primary.crt --ca ./intermediate.crt --port 443  # Signaling server is listening on 0.0.0.0:443
```

## Server protocol

Server uses [Protocol Buffers](https://developers.google.com/protocol-buffers/) for encode/decode all messages.

```protobuf
syntax = "proto3";

message Message {
  oneof type {
    // INCOMING AND OUTCOMING MESSAGES
    // Server sends `heartbeat` message each 5 seconds and expects getting the
    // same message back. If after 3 tentatives still no response then close the
    // connection.
    // Server sends a heartbeat every 5 seconds and expects to receive it as well. After three missed heartbeats
    bool heartbeat = 1;
    // Any message to be exchanged between two peers.
    // For instance WebRTC offer, answer and candidates.
    Content content = 2;

    // INCOMING MESSAGE
    // Peer either wants to make sure that he is still a group member or wants
    // to become one.
    GroupData connect = 3;

    // OUTCOMING MESSAGE
    // Response to the connect request above. True if the peer is the only member
    // of the group or he is connected to at least one group member. Otherwise the
    // signaling server subscribes this peer to one of the group member (i.e. the
    // content message maybe exchanged) .
    bool connected = 4;
  }
}

message Content {
  uint32 senderId = 1;
  uint32 recipientId = 2;
  bool lastData = 2; // Indicates that this is the last data to be forwarded
  bytes data = 3; // Any data sent by the peer
}

message GroupData {
  uint32 id = 1; // Current peer id in the group
  repeated uint32 members = 2; // Peer's members view. Maybe an empty array.
}
```

Server may close the socket with the following codes:

- **ERR_KEY: 4741** // Inappropriate key format (e.g. key too long)
- **ERR_HEARTBEAT = 4742** // Heart-beats error
- **ERR_MESSAGE = 4743** // Any error due to message: type, format etc.
- **ERR_BLOCKING_MEMBER = 4744** // When only one member left in the group and new peers could not join via him.
