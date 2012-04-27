(function(exports) {

  function MockBackend() {
    this.sent = [];
    this.queue = [];
  }

  MockBackend.prototype = {

    connectionId: 0,

    reset: function() {
      this.sent.length = 0;
      this.queue.length = 0;
    },

    send: function(cmd, cb) {
      this.sent.push(cmd);
      this.queue.push(cb);
    },

    respond: function(cmd) {
      if (this.queue.length) {
        (this.queue.shift())(cmd);
      }
    }
  };

  exports.MockBackend = MockBackend;

}(
  (typeof(window) === 'undefined') ? module.exports : window
));
