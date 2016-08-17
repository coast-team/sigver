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
  var keyHolders = new Set();

  function error(socket, code, msg) {
    console.log('Error ' + code + ': ' + msg);
    socket.close(code, msg);
  }

  function isKeyExist(key) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = keyHolders[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var h = _step.value;
        if (h.key === key) return true;
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

    return false;
  }

  function getKeyHolder(key) {
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = keyHolders[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var h = _step2.value;
        if (h.key === key) return h;
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }

    return null;
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
        try {
          if ('key' in msg) {
            if (isKeyExist(msg.key)) {
              socket.send('{"isKeyOk":false}');
              error(socket, KEY_ALREADY_EXISTS, 'The key already exists');
            } else {
              socket.send('{"isKeyOk":true}');
              socket.connectingPeers = [];
              socket.key = msg.key;
              keyHolders.add(socket);
              socket.on('close', function (event) {
                keyHolders.delete(socket);
                var _iteratorNormalCompletion3 = true;
                var _didIteratorError3 = false;
                var _iteratorError3 = undefined;

                try {
                  for (var _iterator3 = socket.connectingPeers[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var s = _step3.value;

                    s.close(KEY_NO_LONGER_AVAILABLE, 'The peer with this key is no longer available');
                  }
                } catch (err) {
                  _didIteratorError3 = true;
                  _iteratorError3 = err;
                } finally {
                  try {
                    if (!_iteratorNormalCompletion3 && _iterator3.return) {
                      _iterator3.return();
                    }
                  } finally {
                    if (_didIteratorError3) {
                      throw _iteratorError3;
                    }
                  }
                }
              });
            }
          } else if ('id' in msg && 'data' in msg) {
            socket.connectingPeers[+msg.id].send(JSON.stringify({ data: msg.data }));
          } else if ('join' in msg) {
            if (isKeyExist(msg.join)) {
              (function () {
                socket.send('{"isKeyOk":true}');
                socket.keyHolder = getKeyHolder(msg.join);
                var id = socket.keyHolder.connectingPeers.length;
                socket.keyHolder.connectingPeers[id] = socket;
                socket.on('close', function (event) {
                  if (socket.keyHolder.readyState === OPEN) {
                    socket.keyHolder.send(JSON.stringify({ id: id, unavailable: true }));
                  }
                  socket.keyHolder.connectingPeers.splice(id, 1);
                });
                if ('data' in msg) {
                  socket.keyHolder.send(JSON.stringify({ id: id, data: msg.data }));
                }
              })();
            } else {
              socket.send('{"isKeyOk":false}');
              error(socket, KEY_UNKNOWN, 'Unknown key: ' + msg.join);
            }
          } else if ('data' in msg) {
            if ('keyHolder' in socket) {
              var _id = socket.keyHolder.connectingPeers.indexOf(socket);
              if (socket.keyHolder.readyState === OPEN) socket.keyHolder.send(JSON.stringify({ id: _id, data: msg.data }));
            } else {
              console.log('The client has not been assigned yet to a keyHolder');
            }
          } else {
            error(socket, MESSAGE_UNKNOWN_ATTRIBUTE, 'Unknown JSON attribute: ' + data);
          }
        } catch (err) {
          error(socket, err.code, err.message);
        }
      });

      socket.on('error', function (event) {
        return console.log('ERROR: ', event);
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