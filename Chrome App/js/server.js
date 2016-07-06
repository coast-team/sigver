/* global http, document  */
"use strict"

const PORT = 8000

// CloseEvent codes
const DATA_SYNTAX_ERROR = 4000
const DATA_UNKNOWN_ATTRIBUTE = 4001
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
            error(socket, DATA_SYNTAX_ERROR,
              'Server accepts only JSON')
          }

          try {
            if (msg.hasOwnProperty('key')) {
              // creation of a channel

              for (let master of connectedSockets) {
                if (master.key === msg.key) {
                  error(socket, KEY_ALREADY_EXISTS,
                    'The key already exists')
                  return
                }
              }
              socket.key = msg.key
              socket.joiningClients = []

              // log('a key has been approved')
              chrome.runtime.sendMessage(JSON.stringify({log: 'a key has been approved'}))

              addConnection(socket.connectionNumber, 'Key: ' + msg.key, 'Running', socket)

              // updateConnections()
              chrome.runtime.sendMessage(JSON.stringify({updateConnections: true}))

            } else if (msg.hasOwnProperty('id')) {
              // sending data to the client with the corresponding id

              for (let index in socket.joiningClients) {
                if (index === msg.id.toString()) {
                  socket.joiningClients[index].send(JSON.stringify({
                    data: msg.data
                  }))
                  return
                }
              }
              socket.send(JSON.stringify({
                id: msg.id,
                unavailable: true
              }))
            } else if (msg.hasOwnProperty('join')) {
              // a new client joins the channel

              for (let master of connectedSockets) {
                if (master.key === msg.join) {
                  // log('master found, join succeeded')
                  chrome.runtime.sendMessage(JSON.stringify({log: 'master found, join succeeded'}))

                  socket.master = master
                  master.joiningClients.push(socket)
                  let id = master.joiningClients.length - 1
                  master.send(JSON.stringify({
                    id,
                    data: msg.data
                  }))

                  addConnection(socket.connectionNumber, 'Join: ' + msg.join, 'Running', socket)

                  // updateConnections()
                  chrome.runtime.sendMessage(JSON.stringify({updateConnections: true}))

                  return
                }
              }
              error(socket, KEY_UNKNOWN, 'Unknown key')
            } else if (msg.hasOwnProperty('data') && socket.hasOwnProperty('master')) {
              // a client sends datas

              let id = socket.master.joiningClients.indexOf(socket)
              if (socket.master.readyState === WEBSOCKET_OPEN) {
                socket.master.send(JSON.stringify({
                  id,
                  data: msg.data
                }))
              }
            } else {
              error(socket, DATA_UNKNOWN_ATTRIBUTE, 'Unsupported message format')
            }
          } catch (event) {
            error(socket, DATA_SYNTAX_ERROR, 'Server accepts only JSON')
          }
        })

        socket.addEventListener('close', () => {
          socket.stoppedAt = new Date().valueOf()

          // When a socket is closed, we notify pending clients that the server is leaving
          if (socket.hasOwnProperty('joiningClients')) {
            for (let client of socket.joiningClients) {
              // log('closing connection with pending client ', client)
              chrome.runtime.sendMessage(JSON.stringify({log: 'closing connection with pending client'}))

              client.close(KEY_NO_LONGER_AVAILABLE,
                'The peer is no longer available')
            }
          }

          // When a socket is closed, remove it from the list of connected sockets.
          for (var i = 0 ; i < connectedSockets.length ; i++) {
            if (connectedSockets[i] === socket) {
              connectedSockets.splice(i, 1)
              break
            }
          }

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
function error(socket, code, msg) {
  // log('Error ' + code + ': ' + msg)
  chrome.runtime.sendMessage(JSON.stringify({log: 'Error ' + code + ': ' + msg}))

  socket.close(code, msg)
}
