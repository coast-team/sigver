Very simple signaling server based on WebSocket to test WebRTC.

## How to use
Install the chrome application in chrome. To get a more user-friendly use of the application, also install the chrome extension.
Then you can run the server by launching the application or using the extension.

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
