(function(exports){
  if(typeof(exports.Marionette) === 'undefined'){
    exports.Marionette = {};
  }

  if(typeof(exports.Marionette.Backends) === 'undefined'){
    exports.Marionette.Backends = {};
  }

  if(typeof(TestAgent) === 'undefined'){
    TestAgent = require('test-agent/lib/test-agent/websocket-client').TestAgent;
  }

  function Websocket(options){
    this.client = new TestAgent.WebsocketClient(options);
    this._sendQueue = [];
    this._responseQueue = [];

    this.client.on('device response', this._onDeviceResponse.bind(this));
  }

  Websocket.prototype = {

    /**
     * Timeout for commands
     *
     * @property timeout
     * @type Numeric
     */
    timeout: 10000,

    /**
     * Waiting for a command to finish?
     *
     * @property _waiting
     * @type Boolean
     */
    _waiting: false,

    /**
     * Is system ready for commands?
     *
     * @property ready
     * @type Boolean
     */
    ready: false,

    /**
     * Connection id for the server.
     *
     * @property connectionId
     * @type Numeric
     */
    connectionId: null,

    /**
     * Sends remote command to server.
     * Each command will be queued while waiting for
     * any pending commands. This ensures order of
     * response is correct.
     *
     *
     * @param {Object} command
     * @param {Function} callback
     */
    send: function(cmd, callback){
      if(!this.ready){
        throw new Error('connection is not ready');
      }

      if(typeof(callback) === 'undefined'){
        throw new Error('callback is required');
      }

      this._responseQueue.push(callback);
      this._sendQueue.push(cmd);

      this._nextCommand();
    },

    /**
     * Checks queue if not waiting for a response
     * Sends command to websocket server
     *
     * @private
     */
    _nextCommand: function(){
      if(!this._waiting && this._sendQueue.length){
        this._waiting = true;
        this._sendCommand(this._sendQueue.shift());
      }
    },

    /**
     * Sends a command to the websocket server.
     *
     * @param {Object} command
     * @private
     */
    _sendCommand: function(cmd){
      this.client.send('device command', {
        id: this.connectionId,
        command: cmd
      });
    },

    /**
     * Handles responses from devices.
     * Will only respond to the event if the connectionId
     * is equal to the event id and the client is ready.
     *
     * @param {Object} data
     * @private
     */
    _onDeviceResponse: function(data){
      var cb;
      if(this.ready && this.connectionId && data.id === this.connectionId){
        cb = this._responseQueue.shift();
        cb(data.response);

        this._waiting = false;
        this._nextCommand();
      }
    },

    /**
     * Opens a connection to the websocket server and creates
     * a device connection.
     *
     * @param {Function} callback sent when initial response comes back
     */
    connect: function(callback){
      var self = this;

      this.client.start();

      this.client.on('open', function wsOpen(){

        //because I was lazy and did not implement once
        function connected(data){
          self.client.removeEventListener('device ready', connected);
          self.connectionId = data.id;
        }

        function open(data){
          if(data.id === self.connectionId){
            self.client.removeEventListener('device response', data);
            self.ready = true;
            callback(data.response);
          }
        }

        self.client.on('device ready', connected);
        self.client.on('device response', open);

        self.client.send('device create');

        self.client.removeEventListener('open', wsOpen);
      });

    }

  };

  exports.Marionette.Backends.Websocket = Websocket;

}(
  (typeof(window) === 'undefined')? module.exports : window
));
