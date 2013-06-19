var Abstract, CommandStream;
var net = require('net');
var debug = require('debug')('marionette:tcp');

Abstract = require('./abstract');
CommandStream = require('../../marionette/command-stream');

var MAX_TRIES = 10;
var WAIT_BETWEEN_TRIES_MS = 250;

/** TCP **/
Tcp.Socket = net.Socket;

/**
 * Tries to connect to a given socket location.
 * Will retry on failure.
 *
 *  waitForSocket(2828, 'localhost', function(err, socket) {
 *  });
 *
 * Note- there is a forth argument used to recursion that should
 * never be used publicly.
 *
 * @param {Number} port to connect to.
 * @param {String} host like localhost.
 * @param {Function} callback [err, socket].
 */
function waitForSocket(port, host, callback, _tries) {
  debug('attempt to open socket', port, host);
  _tries = _tries || 0;
  if (_tries >= MAX_TRIES)
    return callback(new Error('cannot connect to marionette'));

  function handleError() {
    debug('socket is not ready trying');
    // retry connection
    setTimeout(
      waitForSocket,
      // wait at least WAIT_BETWEEN_TRIES_MS or a multiplier
      // of the attempts.
      (WAIT_BETWEEN_TRIES_MS * _tries) || WAIT_BETWEEN_TRIES_MS,
      port,
      host,
      callback,
      ++_tries
    );
  }

  var socket = new Tcp.Socket();
  socket.connect(port, host, function(one, two) {
    debug('connected', port, host);
    socket.removeListener('error', handleError);
    callback(null, socket);
  });
  socket.once('error', handleError);
}

/**
 * NodeJS only tcp socket driver for marionette.
 * See {{#crossLink "Marionette.Drivers.MozTcp"}}{{/crossLink}}
 * for the gecko/xpcom vesion of this driver.
 *
 * @class Marionette.Drivers.Tcp
 * @extends Marionette.Drivers.Abstract
 * @constructor
 * @param {Options} options connection options.
 *   @param {String} [options.host="localhost"] host.
 *   @param {Numeric} [options.port="2828"] port.
 */
function Tcp(options) {
  if (!options) {
    options = {};
  }

  Abstract.call(this, options);

  this.connectionId = 0;
  /**
   * @property host
   * @type String
   */
  this.host = options.host || 'localhost';

  /**
   * @property port
   * @type Numeric
   */
  this.port = options.port || 2828;
}

Tcp.prototype = Object.create(Abstract.prototype);

/**
 * Sends a command to the server.
 *
 * @param {Object} cmd remote marionette command.
 */
Tcp.prototype._sendCommand = function _sendCommand(cmd) {
  this.client.send(cmd);
};

/**
 * Opens TCP socket for marionette client.
 */
Tcp.prototype._connect = function connect() {
  var client, self = this;

  waitForSocket(this.port, this.host, function(err, socket) {
    debug('got socket starting command stream');
    this.socket = socket;
    client = this.client = new CommandStream(this.socket);
    this.client.on('command', this._onClientCommand.bind(this));
  }.bind(this));
};

/**
 * Receives command from server.
 *
 * @param {Object} data response from marionette server.
 */
Tcp.prototype._onClientCommand = function(data) {
  this._onDeviceResponse({
    id: this.connectionId,
    response: data
  });
};

/**
 * Closes connection to marionette.
 */
Tcp.prototype._close = function close() {
  if (this.socket && this.socket.destroy) {
    this.socket.destroy();
  }
};

/** export */
module.exports = exports = Tcp;
