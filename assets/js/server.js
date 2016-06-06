/* global http, document  */
"use strict";

const PORT = 8000;

// CloseEvent codes
const DATA_SYNTAX_ERROR = 4000;
const DATA_UNKNOWN_ATTRIBUTE = 4001;
const KEY_ALREADY_EXISTS = 4002;
const KEY_UNKNOWN = 4003;
const KEY_NO_LONGER_AVAILABLE = 4004;

const WEBSOCKET_OPEN = 1;

/**
 * Logging function.
 * @param {text} text to log.
 */
function log(text) {
  if (document.getElementById('log') === "undefined" ||
      document.getElementById('log') === null) {
    console.log(text);
  } else {
    document.getElementById('log').value += text + '\n';
  }
}

class SigVer {

  constructor() {
    this.server = new http.Server();
    this.wsServer = new http.WebSocketServer(this.server);
    this.serverSocketId = -1;
  }

  start(port) {
    if (http.Server && http.WebSocketServer) {
      // Listen for HTTP connections.
      // var server = new http.Server();
      // var wsServer = new http.WebSocketServer(server);
      this.server.listen(port);
      log('Server runs on: ws://localhost:' + port);

      // Check if the http server is running
      this.server.addEventListener('request', function(req) {
        var url = req.headers.url;
        if (url === '/') {
          url = '/index.html';
        }
        // Serve the pages of this chrome application.
        req.serveUrl(url);
        return true;
      });

      // A list of connected websockets.
      var connectedSockets = [];

      this.wsServer.addEventListener('request', function(req) {
        var socket = req.accept();
        connectedSockets.push(socket);

        // When a message is received on one socket, rebroadcast it on all
        // connected sockets.
        socket.addEventListener('message', function(event) {
          let msg;
          let data = event.data;
          try {
            msg = JSON.parse(data); // or e ?
          } catch (event) {
            error(socket, DATA_SYNTAX_ERROR,
              'Server accepts only JSON');
          }
          try {
            if (msg.hasOwnProperty('key')) {
              // for (let master of server.clients) {
              for (let master of connectedSockets) {
                if (master.key === msg.key) {
                  error(socket, KEY_ALREADY_EXISTS,
                    'The key already exists');
                  return;
                }
              }
              socket.key = msg.key;
              socket.joiningClients = [];
            } else if (msg.hasOwnProperty('id')) {
              for (let index in socket.joiningClients) {
                if (index === msg.id.toString()) {
                  socket.joiningClients[index].send(JSON.stringify({
                    data: msg.data
                  }));
                  return;
                }
              }
              socket.send(JSON.stringify({
                id: msg.id,
                unavailable: true
              }));
            } else if (msg.hasOwnProperty('join')) {
              for (let master of connectedSockets) {
                if (master.key === msg.join) {
                  log('master found');
                  socket.master = master;
                  master.joiningClients.push(socket);
                  let id = master.joiningClients.length - 1;
                  master.send(JSON.stringify({
                    id,
                    data: msg.data
                  }));
                  return;
                }
              }
              error(socket, KEY_UNKNOWN, 'Unknown key');
            } else if (msg.hasOwnProperty('data') && socket.hasOwnProperty(
                'master')) {
              let id = socket.master.joiningClients.indexOf(socket);
              if (socket.master.readyState === WEBSOCKET_OPEN) {
                socket.master.send(JSON.stringify({
                  id,
                  data: msg.data
                }));
              }
            } else {
              error(socket, DATA_UNKNOWN_ATTRIBUTE,
                'Unsupported message format');
            }
          } catch (event) {
            error(socket, DATA_SYNTAX_ERROR,
              'Server accepts only JSON');
          }
        });

        socket.addEventListener('close', function() {
          // When a socket is closed, we notify pending clients that the server is leaving
          if (socket.hasOwnProperty('joiningClients')) {
            for (let client of socket.joiningClients) {
              log('closing connection with pending client ', client);
              client.close(KEY_NO_LONGER_AVAILABLE,
                'The peer is no longer available');
            }
          }
          // When a socket is closed, remove it from the list of connected sockets.
          for (var i = 0; i < connectedSockets.length; i++) {
            if (connectedSockets[i] === socket) {
              connectedSockets.splice(i, 1);
              break;
            }
          }
        });

        return true;
      });
    }
  }

  stop() {
    this.server.stop();
  }

}

/**
 * Close a socket when an error occurs.
 * @param {socket} socket Socket to close.
 * @param {int} code error code.
 * @param {string} msg explicit error message.
 */
function error(socket, code, msg) {
  log('Error ' + code + ': ' + msg);
  socket.close(code, msg);
}
