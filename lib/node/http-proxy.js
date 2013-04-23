var CommandStream = require('../marionette/command-stream');
var http = require('http');

var MSG_INVALID_JSON =
  'Must provide valid json';
var MSG_JSON_ONLY =
  'Proxy server can only handle Content-Type: application/json';

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
function Server(socket, options) {
  this.socket = socket;
  this.stream = new CommandStream(this.socket);
}

Server.prototype = {
  port: 60023,

  _sendMarionetteRequest: function(json, res) {
    this.stream.once('command', function(data) {
      var json = JSON.stringify(data);
      res.writeHead(200, {
        'Content-Length': json.length,
        'Content-Type': 'application/json'
      });
      res.end(json);
    });
    this.stream.send(json);
  },

  _handleRequest: function(req, res) {
    if (req.headers['content-type'] !== 'application/json') {
      res.writeHead(500, {
        'Content-Length': MSG_JSON_ONLY.length,
        'Content-Type': 'text/plain'
      });
      res.end(MSG_JSON_ONLY);
    }

    var buffer = '';

    req.on('data', function(content) {
      // buffer is always json content (or should be)
      buffer += content.toString();
    });

    req.on('error', function(content) {
      console.log('ERR!');
    });

    var json;
    var self = this;
    req.on('end', function() {
      try {
        json = JSON.parse(buffer.trim());
      } catch (e) {
        res.writeHead(500, {
          'Content-Length': MSG_INVALID_JSON,
          'Content-Type': 'text/plain'
        });

        return res.end(MSG_INVALID_JSON);
      }

      // handle the json part
      self._sendMarionetteRequest(json, res);
    });

  },

  listen: function() {
    this._server = http.createServer(this._handleRequest.bind(this));
    this._server.listen(this.port);
  },

  close: function() {
    if (!this._server)
      return callback && process.nextTick(callback);

    this._server.close();
  }

};

module.exports = Server;
