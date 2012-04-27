(function(exports) {
  if (typeof(exports.Marionette) === 'undefined') {
    exports.Marionette = {};
  }

  function Client(backend) {
    this.backend = backend;
  }

  Client.prototype = {

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
    }

  };

  exports.Marionette.Client = Client;

}(
  (typeof(window) === 'undefined') ? module.exports : window
));
