(function(module, ns) {

  var DEFAULT_PORT = 60023;
  var DEFAULT_MARIONETTE_PORT = 2828;
  var DEFAULT_HOST = 'localhost';

  var fork, proxyRunnerPath,
      isNode = typeof(window) === 'undefined',
      XHR = ns.require('xhr');

  if (isNode) {
    proxyRunnerPath = __dirname + '/../../http-proxy-runner';
    fork = require('child_process').fork;
  } else {
    fork = function() {
      throw new Error('Cannot fork Http Proxy from Browser');
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

    if (options && options.marionettePort) {
      this.marionettePort = options.marionettePort;
    }

    this.url = 'http://' + this.hostname + ':' + this.port;
  }

  HttpProxy.prototype = {
    hostname: DEFAULT_HOST,
    port: DEFAULT_PORT,
    marionettePort: DEFAULT_MARIONETTE_PORT,
    isSync: true,
    defaultCallback: function(err, result) {
      if (err) {
        throw err;
      }
      return result;
    },

    _connectToMarionette: function(callback) {
      var data = request(this.url, {
        method: 'POST',
        data: { port: this.marionettePort }
      });
      this._id = data.id;
      callback();
    },

    connect: function(callback) {
      this.serverProcess = fork(
        proxyRunnerPath,
        [
          this.port,
          this.hostname
        ],
        { stdio: 'inherit' }
      );

      this.serverProcess.on('message', function(data) {
        if (data === 'ready') {
          this._connectToMarionette(callback);
        }
      }.bind(this));
    },

    send: function(command, callback) {
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

