/* global http, document  */
"use strict"

const PORT = 8000

const MAX_ID = 4294967295

// CloseEvent codes
const MESSAGE_TYPE_ERROR = 4000
const MESSAGE_UNKNOWN_ATTRIBUTE = 4001
const KEY_ALREADY_EXISTS = 4002
const KEY_UNKNOWN = 4003
const KEY_NO_LONGER_AVAILABLE = 4004

const WEBSOCKET_OPEN = 1

// Get useful functions to display infos on the app's page
// See utils.js for the doc

if (!id) {
  var id = "SigVer_App_Window_1"
}

// function setAddress(text) {chrome.app.window.get(id).contentWindow.setAddress(text)}
// function log(text) {chrome.app.window.get(id).contentWindow.log(text)}
// function setConnectionTime(number, type) {chrome.app.window.get(id).contentWindow.setConnectionTime(number, type)}
// function setConnectionOff(number) {chrome.app.window.get(id).contentWindow.setConnectionOff(number)}
function addConnection(number, type, time, socket) {chrome.app.window.get(id).contentWindow.addConnection(number, type, time, socket)}
// function updateConnections() {chrome.app.window.get(id).contentWindow.updateConnections()}
// function closeAllConnections() {chrome.app.window.get(id).contentWindow.closeAllConnections()}

class SigVer {

  constructor() {
    this.server = new http.Server()
    this.wsServer = new http.WebSocketServer(this.server)
    this.isRunning = false
    this.keyHolders = new Set()
  }

  start(port) {
    let connectionNb = 1

    if (http.Server && http.WebSocketServer) {
      // Listen for HTTP connections.
      let address = "ws://localhost:" + port

      // log('Server runs on: ' + address)
      chrome.runtime.sendMessage(JSON.stringify({log: 'Server runs on: ' + address}))
      this.server.listen(port)

      // Get the available IPv4/IPv6 addresses
      chrome.system.network.getNetworkInterfaces((interfaces) => {
        for (let interfacenumber of interfaces) {
          address += '\nws://' + interfacenumber.address + ':' + port
        }
        // setAddress(address)
        chrome.runtime.sendMessage(JSON.stringify({address}))
      })

      // I think that we can get rid of this listener ; not sure though
      // Check if the http server is running
      this.server.addEventListener('request', (req) => {
        var url = req.headers.url
        if (url === '/') {
          url = '/index.html'
        }
        // Serve the pages of this chrome application.
        req.serveUrl(url)
        return true
      })

      // A list of connected websockets.
      var connectedSockets = []

      this.wsServer.addEventListener('request', (req) => {
        // New socket connected
        var socket = req.accept()
        connectedSockets.push(socket)

        // Add useful infos to the socket
        socket.connectionNumber = connectionNb
        socket.createdAt = new Date().valueOf()
        connectionNb++

        // When a message is received on one socket, rebroadcast it on all connected sockets.
        socket.addEventListener('message', (event) => {
          let msg
          let data = event.data

          try {
            msg = JSON.parse(data)
          } catch (event) {
            error(socket, MESSAGE_TYPE_ERROR, 'Server accepts only JSON string')
          }

          try {
            if ('key' in msg) {
              if (keyExists(msg.key, this.keyHolders)) {
                socket.send('{"isKeyOk":false}')
                error(socket, KEY_ALREADY_EXISTS, `The key ${msg.key} exists already`)
              } else {
                socket.send('{"isKeyOk":true}')
                socket.$connectingPeers = new Map()
                socket.$key = msg.key
                this.keyHolders.add(socket)
                socket.addEventListener('close', () => {
                  socket.stoppedAt = new Date().valueOf()

                  this.keyHolders.delete(socket)
                  socket.$connectingPeers.forEach(s => {
                    s.close(KEY_NO_LONGER_AVAILABLE, `${msg.key} is no longer available`)
                  })

                  // Update visible informations
                  // setConnectionTime(socket.connectionNumber, socket.stoppedAt - socket.createdAt)
                  chrome.runtime.sendMessage(JSON.stringify(
                    {
                      connectionTime: {
                        number: socket.connectionNumber,
                        time: socket.stoppedAt - socket.createdAt
                      }
                    })
                  )

                  // setConnectionOff(socket.connectionNumber)
                  chrome.runtime.sendMessage(JSON.stringify({connectionOff: socket.connectionNumber}))

                  // updateConnections()
                  chrome.runtime.sendMessage(JSON.stringify({updateConnections: true}))
                })

                // log('a key has been approved')
                chrome.runtime.sendMessage(JSON.stringify({log: 'a key has been approved'}))

                addConnection(socket.connectionNumber, 'Key: ' + msg.key, 'Running', socket)

                // updateConnections()
                chrome.runtime.sendMessage(JSON.stringify({updateConnections: true}))
              }
            } else if ('id' in msg && 'data' in msg) {
              // sending data to the client with the corresponding id
              let connectingPeer = socket.$connectingPeers.get(msg.id)
              if (connectingPeer) {
                socket.$connectingPeers.get(msg.id).send(JSON.stringify({data: msg.data}))
              }
            } else if ('join' in msg) {
              // a new client joins the channel
              if (keyExists(msg.join, this.keyHolders)) {
                chrome.runtime.sendMessage(JSON.stringify({log: 'key found, join succeeded'}))
                socket.send('{"isKeyOk":true}')
                socket.$keyHolder = getKeyHolder(msg.join, this.keyHolders)
                let peers = socket.$keyHolder.$connectingPeers
                let id = generateId(peers)
                peers.set(id, socket)
                socket.addEventListener('close', () => {
                  socket.stoppedAt = new Date().valueOf()
                  if (socket.$keyHolder.readyState === WEBSOCKET_OPEN) {
                    socket.$keyHolder.send(JSON.stringify({id, unavailable: true}))
                  }
                  peers.delete(id)
                  // Update visible informations
                  // setConnectionTime(socket.connectionNumber, socket.stoppedAt - socket.createdAt)
                  chrome.runtime.sendMessage(JSON.stringify(
                    {
                      connectionTime: {
                        number: socket.connectionNumber,
                        time: socket.stoppedAt - socket.createdAt
                      }
                    })
                  )

                  // setConnectionOff(socket.connectionNumber)
                  chrome.runtime.sendMessage(JSON.stringify({connectionOff: socket.connectionNumber}))

                  // updateConnections()
                  chrome.runtime.sendMessage(JSON.stringify({updateConnections: true}))
                })
                if ('data' in msg) {
                  socket.$keyHolder.send(JSON.stringify({id, data: msg.data}))
                }
                addConnection(socket.connectionNumber, 'Join: ' + msg.join, 'Running', socket)

                // updateConnections()
                chrome.runtime.sendMessage(JSON.stringify({updateConnections: true}))
              } else {
                socket.send('{"isKeyOk":false}')
                error(socket, KEY_UNKNOWN, 'Unknown key: ' + msg.join)
              }
            } else if ('data' in msg) {
              // a client sends data
              if ('$keyHolder' in socket) {
                let id
                for (let [key, value] of socket.$keyHolder.$connectingPeers) {
                  if (value === socket) {
                    id = key
                    break
                  }
                }
                if (socket.$keyHolder.readyState === WEBSOCKET_OPEN) socket.$keyHolder.send(JSON.stringify({id, data: msg.data}))
              }
            } else {
              error(socket, MESSAGE_UNKNOWN_ATTRIBUTE, 'Unknown JSON attribute: ' + data)
            }
          } catch (err) {
            error(socket, err.code, err.message)
          }
        })

        return true
      })
    }

    this.isRunning = true
    // Notify the extension that the server is running
    chrome.runtime.sendMessage('poegkddcofnkjaclakbkmilkncnajglf', JSON.stringify({serverRunning: true}))
  }

  stop() {
    this.server.stop()
    this.isRunning = false

    // closeAllConnections()
    chrome.runtime.sendMessage(JSON.stringify({closeAllConnections: true}))

    // log("Server stopped")
    chrome.runtime.sendMessage(JSON.stringify({log: 'Server stopped'}))

    // Notify the extension that the server is not running anymore
    chrome.runtime.sendMessage('poegkddcofnkjaclakbkmilkncnajglf', JSON.stringify({serverRunning: false}))
  }

}

/**
 * Close a socket when an error occurs.
 * @param {socket} socket Socket to close.
 * @param {int} code error code.
 * @param {string} msg explicit error message.
 */
 function error (socket, code, msg) {
   console.trace()
   console.log('Error ' + code + ': ' + msg)
   socket.close(code, msg)
 }

 function keyExists (key, keyHolders) {
   for (let h of keyHolders) if (h.$key === key) return true
   return false
 }

 function getKeyHolder (key, keyHolders) {
   for (let h of keyHolders) if (h.$key === key) return h
   return null
 }

 function generateId (peers) {
   let id
   do {
     id = Math.ceil(Math.random() * MAX_ID)
     if (peers.has(id)) continue
     break
   } while (true)
   return id
 }
