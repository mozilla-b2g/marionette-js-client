var CommandStream = require('../marionette/command-stream');
var http = require('http');
var net = require('net');
var debug = require('debug')('marionette:http-proxy');
// for tests we must refer to the object not the single function on the module.
var retryConnect = require('socket-retry-connect');

var MARIONETTE_PORT = 2828;

var MSG_INVALID_JSON =
  'Must provide valid json';
var MSG_JSON_ONLY =
  'Proxy server can only handle Content-Type: application/json';

function replyWithMissingID() {
  return replyWithJSON(res, 400, {
    error: '.id property must be passed in json for DELETE requests'
  });
}

function replyWithJSON(res, status, object) {
  var json = JSON.stringify(object);
  res.writeHead(status, {
    'Content-Length': Buffer.byteLength(json),
    'Content-Type': 'application/json'
  });
  res.end(json);
}

/**
 * Wrap any request that has req, res with logic to buffer and parse json
 * requests.
 */
function waitForResponse(realFunc) {
  return function(req, res) {
    var args = Array.prototype.slice.call(arguments);
    var self = this;
    var buffer = '';

    if (req.headers['content-type'].indexOf('json') !== -1) {
      req.on('data', function(content) {
        buffer += content.toString();
      });

      req.on('end', function() {
        var json;
        try {
          json = JSON.parse(buffer);
        } catch (e) {
          /* ignore invalid json for now */
          //console.error('Invalid JSON!', buffer);
        }
        args.splice(2, 0, json);
        realFunc.apply(self, args);
      });
    } else {
      // add empty json element
      args.splice(2, 0, null);
      realFunc.apply(self, args);
    }
  }
}

/**
 * Creates a proxy server for a marionette socket.
 *
 *
 *    // create a socket to port 2828
 *    var socket;
 *
 *    var server =  new Server(socket, {
 *      port: 60023 // port to listen on
 *    });
 *
 *    // then later can XHR over to send marionette commands
 *
 *    var xhr = new XMLHttpRequest();
 *    xhr.setRequestHeader('Content-Type', 'application/json');
 *    xhr.open('POST', '/', false);
 *    xhr.send(JSON.stringify({
 *      //raw marionette command
 *    }));
 *
 *
 */
function Server(options) {
  if (options) {
    if (options.port)
      this.port = options.port;

    if (options.inactivityTimeout)
      this.inactivityTimeout = options.inactivityTimeout;
  }

  this._nextId = 1;
  this.activeSockets = {};
}

Server.prototype = {
  hostname: 'localhost',
  port: 60023,

  /**
   * Close socket if no activity in this amount of time (in ms)
   */
  inactivityTimeout: 5 * ((1000 * 60) * 60),

  _resetInactivityTimer: function(id) {
    var active = this.activeSockets[id];
    if (active) {
      if (active._timeoutId) {
        clearTimeout(active._timeoutId);
      }

      // set inactivity timeout
      this.activeSockets[id]._timeoutId = setTimeout(
        this._closeSocketById.bind(this, id),
        this.inactivityTimeout
      );
    }
  },

  _sendMarionetteRequest: waitForResponse(function(req, res, json) {
    var id = json.id;
    if (!id || !this.activeSockets[id])
      return replyWithMissingID;

    this._resetInactivityTimer(id);

    var active = this.activeSockets[id];

    function handleError(error) {
      active.stream.removeEventListener('command', handleCommand);

      debug('proxy error', json, error.message, error.stack);
      replyWithJSON(res, 200, { error: error.toString() });
    }

    function handleCommand(data) {
      active.stream.removeEventListener('error', handleError);

      debug('proxy got', json, data);
      replyWithJSON(res, 200, data);
    }

    active.stream
      .once('error', handleError)
      .once('command', handleCommand);

    active.stream.send(json.payload);
  }),

  _openMarionetteSocket: waitForResponse(function(req, res, json) {
    var port = json && json.port || MARIONETTE_PORT;
    retryConnect.waitForSocket({ port: port }, function(err, socket) {
      // unique ID for http proxy
      var id = this._nextId++;

      // create socket
      var stream = new CommandStream(socket);

      this.activeSockets[id] = {
        socket: socket,
        stream: stream,
        id: id
      };

      this._resetInactivityTimer(id);

      replyWithJSON(res, 200, { id: id });
    }.bind(this));
  }),

  _closeSocketById: function(id) {
    var active = this.activeSockets[id];
    if (active) {
      delete this.activeSockets[id];
      active.socket.destroy();

      // clear timer in the case of DELETE request
      if (active._timeoutId) {
        clearTimeout(active._timeoutId);
      }
    }
  },

  _deleteMarionetteSocket: waitForResponse(function(req, res, json) {
    var id = json.id;
    if (!id) {
      return replyWithMissingID;
    }

    this._closeSocketById(id)
    return replyWithJSON(res, 200, {});
  }),

  _handleRequest: function(req, res) {
    debug(req.method);
    switch (req.method) {
      case 'POST':
        this._openMarionetteSocket(req, res);
        break;
      case 'DELETE':
        this._deleteMarionetteSocket(req, res);
        break;
      case 'PUT':
        this._sendMarionetteRequest(req, res);
        break;
    }
  },

  listen: function(callback) {
    this._server = http.createServer(this._handleRequest.bind(this));
    this._server.listen(this.port, this.hostname, callback);
  },

  close: function(callback) {
    if (!this._server)
      return callback && process.nextTick(callback);

    this._server.close(callback);
  }

};

module.exports = Server;
