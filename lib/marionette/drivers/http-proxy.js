(function(module, ns) {

  var spawn,
      isNode = typeof(window) === 'undefined',
      XHR = ns.require('xhr');

  if (isNode) {
    spawn = require('child_process').spawn;
  } else {
    spawn = function() {
      throw new Error('Cannot spawn Http Proxy from Browser');
    };
  }

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
    if (options && options.hostname) {
      this.hostname = options.hostname;
    }

    if (options && options.port) {
      this.port = options.port;
    }

    // if we are given a url, assume proxy server
    // is already running on that url, otherwise
    // spawn the proxy server based on host and port
    if (options && options.url) {
      this.url = options.url;
    } else {
      this.url = 'http://' + this.hostname + ':' + this.port;
      this.serverProcess = spawn(process.env.PWD + '/bin/marionette-http-proxy', [
        this.port,
        this.hostname
      ]);
    }
  }

  HttpProxy.prototype = {
    hostname: 'localhost',
    port: 60023,
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
      var response = request(this.url, {
        method: 'DELETE', data: { id: this._id }
      });
      if (this.serverProcess) {
        this.serverProcess.kill();
      }
      return response;
    }
  };

  module.exports = HttpProxy;

}.apply(
  this,
  (this.Marionette) ?
    [Marionette('drivers/http-proxy'), Marionette] :
    [module, require('../marionette')]
));

