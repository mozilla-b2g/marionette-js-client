(function(exports) {
  if (typeof(exports.Marionette) === 'undefined') {
    exports.Marionette = {};
  }

  if (typeof(exports.Marionette.Backends) === 'undefined') {
    exports.Marionette.Backends = {};
  }

  if (typeof(TestAgent) === 'undefined') {
    TestAgent = require('test-agent/lib/test-agent/websocket-client').TestAgent;
  }

  var Abstract;

  if (typeof(window) === 'undefined') {
    Abstract = require('./abstract').Marionette.Backends.Abstract;
  } else {
    Abstract = Marionette.Backends.Abstract;
  }

  function Websocket(options) {
    Abstract.call(this, options);

    this.client = new TestAgent.WebsocketClient(options);
    this.client.on('device response', this._onDeviceResponse.bind(this));
  }

  Websocket.prototype = Object.create(Abstract.prototype);

  /**
   * Sends a command to the websocket server.
   *
   * @param {Object} command
   * @private
   */
  Websocket.prototype._sendCommand = function(cmd) {
    this.client.send('device command', {
      id: this.connectionId,
      command: cmd
    });
  };

  /**
   * Opens a connection to the websocket server and creates
   * a device connection.
   *
   * @param {Function} callback sent when initial response comes back.
   */
  Websocket.prototype.connect = function(callback) {
    var self = this;

    this.client.start();

    this.client.on('open', function wsOpen() {

      //because I was lazy and did not implement once
      function connected(data) {
        self.client.removeEventListener('device ready', connected);
        self.connectionId = data.id;
      }

      function open(data) {
        if (data.id === self.connectionId) {
          var result = self.client.removeEventListener('device response', open);
          self.ready = true;
          callback(data.response);
        }
      }

      //order is important
      self.client.removeEventListener('open', wsOpen);
      self.client.on('device ready', connected);
      self.client.on('device response', open);

      self.client.send('device create');

    });

  };

  exports.Marionette.Backends.Websocket = Websocket;

}(
  (typeof(window) === 'undefined') ? module.exports : window
));
