(function(exports) {
  if (typeof(exports.Marionette) === 'undefined') {
    exports.Marionette = {};
  }

  function Client(backend) {
    this.backend = backend;
  }

  Client.prototype = {

    CHROME: 'chrome',
    CONTENT: 'content',

    /**
     * Actor id for instance
      *
     *
     * @type String
     */
    actor: null,

    /**
     * Session id for instance.
     *
     * @type String
     */
    session: null,

    /**
     * Sends a command to the server.
     * Adds additional information like actor and session
     * to command if not present.
     *
     *
     * @param {Function} cb executed when response is sent.
     */
    send: function send(cmd, cb) {
      if (!cmd.to) {
        cmd.to = this.actor || 'root';
      }

      if (this.session) {
        cmd.session = cmd.session || this.session;
      }

      this.backend.send(cmd, cb);

      return this;
    },

    /**
     * Sends request and formats response.
     *
     *
     * @param {Object} command marionette command.
     * @param {String} responseKey the part of the response to pass \
     *                             unto the callback.
     * @param {Object} callback wrapped callback.
     */
    _sendCommand: function(command, responseKey, callback) {
      this.send(command, function(data) {
        callback(data[responseKey]);
      });
      return this;
    },

    /**
     * Finds the actor for this instance.
     *
     * @private
     * @param {Function} callback executed when response is sent.
     */
    _getActorId: function _getActorId(callback) {
      var self = this;

      function getMarionetteId(data) {
        self.actor = data.id;
        if (callback) {
          callback(data);
        }
      }

      this.send({ type: 'getMarionetteID' }, getMarionetteId);
    },

    /**
     * Starts a remote session.
     *
     * @private
     * @param {Function} callback optional.
     */
    _newSession: function _newSession(callback) {
      var self = this;

      function newSession(data) {
        self.session = data.value;
        if (callback) {
          callback(data);
        }
      }

      this.send({ type: 'newSession' }, newSession);
    },

    /**
     * Finds actor and creates connection to marionette.
     * This is a combination of calling getMarionetteId and then newSession.
     *
     * @param {Function} callback executed when session is started.
     */
    startSession: function startSession(callback) {
      var self = this;
      this._getActorId(function() {
        //actor will not be set if we send the command then
        self._newSession(callback);
      });
    },

    /**
     * Callback will recieve the id of the current window.
     *
     * @param {Function} callback executed with id of current window.
     * @return {Object} self.
     */
    getWindow: function getWindow(callback) {
      var cmd = { type: 'getWindow' };
      return this._sendCommand(cmd, 'value', callback);
    },

    /**
     * Callback will recieve an array of window ids.
     *
     *
     * @param {Function} callback executes with an array of ids.
     */
    getWindows: function getWindows(callback) {
      var cmd = { type: 'getWindows' };
      return this._sendCommand(cmd, 'value', callback);
    },

    /**
     * Switches context of marionette to specific window.
     *
     *
     * @param {String} id window id you can find these with getWindow(s).
     * @param {Function} callback called with boolean.
     */
    switchToWindow: function switchToWindow(id, callback) {
      var cmd = { type: 'switchToWindow', value: id };
      return this._sendCommand(cmd, 'value', callback);
    },

    /**
     * Switches context of window.
     *
     * @param {String} context either: 'chome' or 'content'.
     * @param {Function} callback recieves boolean.
     */
    setContext: function setContext(content, callback) {
      if (content !== this.CHROME && content !== this.CONTENT) {
        throw new Error('content type must be "chrome" or "content"');
      }

      var cmd = { type: 'setContext', value: content };
      return this._sendCommand(cmd, 'value', callback);
    },

    /**
     * Sets the script timeout
     *
     *
     *
     * @param {Numeric} timeout max time in ms.
     * @param {Function} callback executed with boolean status.
     * @return {Object} self.
     */
    setScriptTimeout: function setScriptTimeout(timeout, callback) {
      var cmd = { type: 'setScriptTimeout', value: timeout };
      return this._sendCommand(cmd, 'ok', callback);
    },

    /**
     * setSearchTimeout
     *
     * @param {Numeric} timeout max time in ms.
     * @param {Function} callback executed with boolean status.
     * @return {Object} self.
     */
    setSearchTimeout: function setSearchTimeout(timeout, callback) {
      var cmd = { type: 'setSearchTimeout', value: timeout };
      return this._sendCommand(cmd, 'ok', callback);
    },

    /**
     * Gets url location for device.
     *
     * @param {Function} callback recevies url.
     */
    getUrl: function getUrl(callback) {
      var cmd = { type: 'getUrl' };
      return this._sendCommand(cmd, 'value', callback);
    },

    /**
     * Goes forward.
     *
     *
     * @param {Function} callback recieves boolean.
     */
    goForward: function goForward(callback) {
      var cmd = { type: 'goForward' };
      return this._sendCommand(cmd, 'ok', callback);
    },

    /**
     * Goes back.
     *
     *
     * @param {Function} callback recieves boolean.
     */
    goBack: function goBack(callback) {
      var cmd = { type: 'goBack' };
      return this._sendCommand(cmd, 'ok', callback);
    }

  };

  exports.Marionette.Client = Client;

}(
  (typeof(window) === 'undefined') ? module.exports : window
));
