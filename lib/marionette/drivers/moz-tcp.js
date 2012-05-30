/**
@namespace
*/
(function(module, ns) {

  if (!this.MozTCPSocket) {
    return;
  }

  var Abstract, CommandStream;

  Abstract = ns.require('drivers/abstract');
  CommandStream = ns.require('command-stream');



  /** TCP **/
  Tcp.Socket = MozTCPSocket;

  function Tcp(options) {
    if (typeof(options)) {
      options = {};
    }
    Abstract.call(this, options);


    this.connectionId = 0;
    this.host = options.host || '127.0.0.1';
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

    this.socket = new Tcp.Socket(this.host, this.port);
    client = this.client = new CommandStream(this.socket);
    this.client.on('command', this._onClientCommand.bind(this));
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
    if (this.socket && this.socket.close) {
      this.socket.close();
    }
  };

  /** export */
  module.exports = exports = Tcp;

}.apply(
  this,
  (this.Marionette) ?
    [Marionette('drivers/moz-tcp'), Marionette] :
    [module, require('../../lib/marionette/marionette')]
));
