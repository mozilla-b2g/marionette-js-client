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
     * Callback will receive the id of the current window.
     *
     * @param {Function} callback executed with id of current window.
     * @return {Object} self.
     */
    getWindow: function getWindow(callback) {
      var cmd = { type: 'getWindow' };
      return this._sendCommand(cmd, 'value', callback);
    },

    /**
     * Callback will receive an array of window ids.
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
     * @param {Function} callback receives boolean.
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
     * @param {Function} callback receives url.
     */
    getUrl: function getUrl(callback) {
      var cmd = { type: 'getUrl' };
      return this._sendCommand(cmd, 'value', callback);
    },

    /**
     * Refreshes current window on device.
     *
     * @param {Function} callback boolean success.
     * @return {Object} self.
     */
    refresh: function refresh(callback) {
      var cmd = { type: 'refresh' };
      return this._sendCommand(cmd, 'ok', callback);
    },

    /**
     * Drives window forward.
     *
     *
     * @param {Function} callback receives boolean.
     */
    goForward: function goForward(callback) {
      var cmd = { type: 'goForward' };
      return this._sendCommand(cmd, 'ok', callback);
    },

    /**
     * Drives window back.
     *
     *
     * @param {Function} callback receives boolean.
     */
    goBack: function goBack(callback) {
      var cmd = { type: 'goBack' };
      return this._sendCommand(cmd, 'ok', callback);
    },

    /**
     * Logs a message on marionette server.
     *
     *
     * @param {String} message log message.
     * @param {String} level arbitrary log level.
     * @param {Function} callback receives boolean.
     * @return {Object} self.
     */
    log: function log(msg, level, callback) {
      var cmd = { type: 'log', level: level, value: msg };
      return this._sendCommand(cmd, 'ok', callback);
    },

    /**
     * Retrieves all logs on the marionette server.
     * The response from marionette is an array of arrays.
     *
     *    device.getLogs(function(logs){
     *      //logs => [
     *        [
     *          'msg',
     *          'level',
     *          'Fri Apr 27 2012 11:00:32 GMT-0700 (PDT)'
     *        ]
     *      ]
     *    });
     *
     *
     * @param {Function} callback receive an array of logs.
     */
    getLogs: function getLogs(callback) {
      var cmd = { type: 'getLogs' };
      return this._sendCommand(cmd, 'value', callback);
    },

    /**
     * Executes a remote script will block.
     * Script is *not* wrapped in a function.
     *
     * @param {String} script script to run.
     * @param {Array} [args] optional args for script.
     * @param {Array} [timeout] optional args for timeout.
     * @param {Function} callback will receive result of the return \
     *                            call in the script if there is one.
     * @return {Object} self.
     */
    executeJsScript: function executeJsScript(script, args, timeout, callback) {
      if (typeof(timeout) === 'function') {
        callback = timeout;
        timeout = null;
      }
      if (typeof(args) === 'function') {
        callback = args;
        args = null;
      }

      timeout = (typeof(timeout) === 'boolean') ? timeout : true;

      return this._executeScript({
        type: 'executeJSScript',
        value: script,
        timeout: timeout,
        args: args
      }, callback);
    },

    /**
     * Executes a remote script will block.
     * Script is wrapped in a function.
     *
     * @param {String} script script to run.
     * @param {Array} [args] optional args for script.
     * @param {Function} callback will receive result of the return \
     *                            call in the script if there is one.
     * @return {Object} self.
     */
    executeScript: function executeScript(script, args, callback) {
      if (typeof(args) === 'function') {
        callback = args;
        args = null;
      }
      return this._executeScript({
        type: 'executeScript',
        value: script,
        args: args
      }, callback);
    },

    /**
     * Executes a remote script will block.
     * Script is wrapped in a function and will be executed asynchronously.
     *
     * @param {String} script script to run.
     * @param {Array} [args] optional args for script.
     * @param {Function} callback will receive result of the return \
     *                            call in the script if there is one.
     * @return {Object} self.
     */
    executeAsyncScript: function executeAsyncScript(script, args, callback) {
      if (typeof(args) === 'function') {
        callback = args;
        args = null;
      }
      return this._executeScript({
        type: 'executeAsyncScript',
        value: script,
        args: args
      }, callback);
    },


    /**
     * Executes a remote string of javascript.
     * the javascript string will be wrapped in a function
     * by marionette.
     *
     *
     * @param {Object} options objects of execute script.
     * @param {String} options.type command type like 'executeScript'.
     * @param {String} options.value javascript string.
     * @param {String} options.args arguments for script.
     * @param {Boolean} options.timeout timeout only used in 'executeJSScript'.
     * @param {Function} callback executes when script finishes.
     * @return {Object} self.
     */
    _executeScript: function _executeScript(options, callback) {

      var timeout = options.timeout,
          cmd = {
            type: options.type,
            value: options.value,
            args: options.args || []
          };

      if (timeout === true || timeout === false) {
        cmd.timeout = timeout;
      }

      return this._sendCommand(cmd, 'value', callback);
    }

  };

  exports.Marionette.Client = Client;

}(
  (typeof(window) === 'undefined') ? module.exports : window
));
