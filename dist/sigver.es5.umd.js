(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.sigver = global.sigver || {})));
}(this, function (exports) { 'use strict';

  var WebSocketServer = require('ws').Server;
  var OPEN = require('ws').OPEN;

  // CloseEvent codes
  var MESSAGE_TYPE_ERROR = 4000;
  var MESSAGE_UNKNOWN_ATTRIBUTE = 4001;
  var KEY_ALREADY_EXISTS = 4002;
  var KEY_UNKNOWN = 4003;
  var KEY_NO_LONGER_AVAILABLE = 4004;

  var server = void 0;
  var keys = new Map();

  function error(socket, code, msg) {
    console.log('Error ' + code + ': ' + msg);
    socket.close(code, msg);
  }

  function start(host, port) {
    var onStart = arguments.length <= 2 || arguments[2] === undefined ? function () {} : arguments[2];

    server = new WebSocketServer({ host: host, port: port }, function () {
      console.log('Server runs on: ' + host + ':' + port);
      onStart();
    });

    server.on('connection', function (socket) {
      socket.on('message', function (data) {
        var msg = void 0;
        try {
          msg = JSON.parse(data);
        } catch (event) {
          error(socket, MESSAGE_TYPE_ERROR, 'Server accepts only JSON string');
        }
        if ('key' in msg) {
          if (keys.has(msg.key)) {
            socket.send('{"isKeyOk":"false"}');
            error(socket, KEY_ALREADY_EXISTS, 'The key already exists');
          } else {
            socket.send('{"isKeyOk":"true"}');
            socket.joiningSockets = [];
            keys.set(msg.key, socket);
          }
        } else if ('id' in msg) {
          socket.joiningSockets[+msg.id].send(JSON.stringify({ data: msg.data }));
        } else if ('join' in msg) {
          if (keys.has(msg.join)) {
            socket.keyHolder = keys.get(msg.join);
            var id = socket.keyHolder.joiningSockets.length;
            socket.keyHolder.joiningSockets[id] = socket;
            console.log('length after ADD: ' + socket.keyHolder.joiningSockets.length);
            socket.send('{"isJoinOk":"true"}');
            if ('data' in msg) {
              socket.keyHolder.send(JSON.stringify({ id: id, data: msg.data }));
            }
          } else {
            socket.send('{"isJoinOk":"false"}');
            error(socket, KEY_UNKNOWN, 'Unknown key');
          }
        } else if ('data' in msg) {
          var _id = socket.keyHolder.joiningSockets.indexOf(socket);
          if ('keyHolder' in socket) {
            socket.keyHolder.send(JSON.stringify({ id: _id, data: msg.data }));
          } else {
            console.log('The client ' + _id + ' has not been assigned yet to a keyHolder');
          }
        } else {
          error(socket, MESSAGE_UNKNOWN_ATTRIBUTE, 'Unknown JSON attribute: ' + data);
        }
      });

      socket.on('close', function (event) {
        if ('keyHolder' in socket) {
          var id = socket.keyHolder.joiningSockets.indexOf(socket);
          if (socket.keyHolder.readyState === OPEN) {
            socket.keyHolder.send(JSON.stringify({ id: id, unavailable: true }));
          }
          socket.keyHolder.joiningSockets.splice(id, 1);
          console.log('length after REMOVE: ' + socket.keyHolder.joiningSockets.length);
        } else {
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = socket.joiningSockets[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var s = _step.value;

              s.close(KEY_NO_LONGER_AVAILABLE, 'The peer with this key is no longer available');
            }
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }
        }
      });

      socket.on('error', function (event) {
        console.log('ERROR: ', event);
      });
    });
  }

  function stop() {
    console.log('Server has stopped successfully');
    server.close();
  }

  exports.start = start;
  exports.stop = stop;

  Object.defineProperty(exports, '__esModule', { value: true });

}));