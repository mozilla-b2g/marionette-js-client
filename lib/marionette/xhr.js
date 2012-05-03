(function(exports) {
  if (typeof(exports.Marionette) === 'undefined') {
    exports.Marionette = {};
  }

  var Native;

  if (typeof(window) === 'undefined') {
    Native = require('xmlhttprequest').XMLHttpRequest;
  } else {
    Native = XMLHttpRequest;
  }

  function Xhr(options) {
    var key;
    if (typeof(options) === 'undefined') {
      options = {};
    }

    for (key in options) {
      if (options.hasOwnProperty(key)) {
        this[key] = options[key];
      }
    }
  }

  Xhr.prototype = {
    xhrClass: Native,
    method: 'GET',
    async: true,
    waiting: false,

    headers: {
      'content-type': 'application/json'
    },
    data: {},

    _seralize: function _seralize() {
      if (this.headers['content-type'] === 'application/json') {
        return JSON.stringify(this.data);
      }
      return this.data;
    },

    send: function send(callback) {
      var header, xhr;

      if (typeof(callback) === 'undefined') {
        callback = this.callback;
      }

      xhr = this.xhr = new this.xhrClass();
      xhr.open(this.method, this.url, this.async);

      for (header in this.headers) {
        if (this.headers.hasOwnProperty(header)) {
          xhr.setRequestHeader(header, this.headers[header]);
        }
      }

      xhr.onreadystatechange = function onReadyStateChange() {
        var data, type;
        if (xhr.readyState === 4) {
          data = xhr.responseText;
          type = xhr.getResponseHeader('content-type');
          if (type === 'application/json') {
            data = JSON.parse(data);
          }
          this.waiting = false;
          callback(data, xhr);
        }
      }.bind(this);

      this.waiting = true;
      xhr.send(this._seralize());
    }
  };

  exports.Marionette.Xhr = Xhr;

}(
  (typeof(window) === 'undefined') ? module.exports : window
));
