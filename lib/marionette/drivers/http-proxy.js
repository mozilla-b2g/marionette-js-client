(function(module, ns) {

  var XHR = ns.require('xhr');

  function request(url, options) {
    options.url = url;
    options.async = false;
    options.headers = { 'Content-Type': 'application/json' };

    var xhr = new XHR(options);
    var response;
    xhr.send(function(json) {
      if (typeof(json) === 'string') {
        // for node
        json = JSON.parse(json);
      }
      response = json;
    });
    return response;
  }

  function HttpProxy(options) {
    if (options && options.url) {
      this.url = options.url;
    }
  }

  HttpProxy.prototype = {
    url: 'http://localhost:60023',
    isSync: true,
    defaultCallback: function(err, result) {
      if (err) {
        throw err;
      }
      return result;
    },

    connect: function() {
      var data = request(this.url, { method: 'POST' });
      this._id = data.id;
    },

    send: function(command, callback) {
      if (!this._id) {
        this.connect();
      }

      var wrapper = { id: this._id, payload: command };
      var result = request(this.url, { method: 'PUT', data: wrapper });
      return callback(result);
    },

    close: function() {
      return request(this.url, { method: 'DELETE', data: { id: this._id } });
    }
  };

  module.exports = HttpProxy;

}.apply(
  this,
  (this.Marionette) ?
    [Marionette('drivers/http-proxy'), Marionette] :
    [module, require('../marionette')]
));

