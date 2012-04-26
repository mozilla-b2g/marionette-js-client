(function(window){

  if(typeof(window.Marionette) === 'undefined'){
    window.Marionette = {};
  }

  if(typeof(window.Marionette.Backends) === 'undefined'){
    window.Marionette.Backends = {};
  }

  var Abstract = Marionette.Backends.Abstract;

  function Httpd(options){
    var key;
    if(typeof(options) === 'undefined'){
      options = options;
    }

    Abstract.call(this);

    for(key in options){
      if(options.hasOwnProperty(key)){
        this[key] = options[key];
      }
    }
  }

  var proto = Httpd.prototype = Object.create(Abstract.prototype);

  /**
   * Location of the http server that will proxy to marionette
   *
   * @property proxyUrl
   * @type String
   */
  proto.proxyUrl = '/marionette';

  /**
   * Port that proxy should connect to.
   *
   *
   * @property port
   * @type Numeric
   */
  proto.port = 2828;

  /**
   * Server proxy should connect to.
   *
   *
   * @property server
   * @type String
   */
  proto.server = 'localhost';

  /**
   * Sends command to server for this connection
   *
   *
   * @param {Object} command
   */
  proto._sendCommand = function(cmd){
    this._request('PUT', cmd, function(){
      //error handling?
    });
  };

  /**
   * Opens connection for device.
   *
   * @param {Function} callback
   */
  proto._connect = function(){
    var auth = {
      server: this.server,
      port: this.port
    };

    this._request('POST', auth, function(data, xhr){
      if(xhr.status === 200){
        this.connectionId = data.id;
        this._pollingRequest = this._request('GET', this._onQueueResponse.bind(this));
      } else {
        //throw error
      }
    }.bind(this));
  };

  /**
   * Creates xhr request
   *
   *
   * @param {String} method
   * @param {Object} data optional
   * @param {Object} callback
   */
  proto._request = function(method, data, callback){
    var request, url;

    if(typeof(callback) === 'undefined' && typeof(data) === 'function'){
      callback = data;
      data = null;
    }

    url = this.proxyUrl;

    if(this.connectionId !== null){
      url += '?' + String(this.connectionId) + '=' + String(Date.now());
    }

    request = new Marionette.Xhr({
      url: url,
      method: method,
      data: data || null,
      callback: callback
    });

    request.send();

    return request;
  };

  /**
   * Handles response to multiple messages.
   * Requeues the _pollingRequest on success
   *
   *    {
   *      messages: [
   *        { id: 1, response: {} },
   *        ....
   *      ]
   *    }
   *
   * @param {Object}
   */
  proto._onQueueResponse = function(queue, xhr){
    var self = this;

    if(xhr.status !== 200){
      throw new Error("XHR responded with code other then 200");
    }

    //TODO: handle errors
    if(queue && queue.messages){
      queue.messages.forEach(function(response){
        self._onDeviceResponse(response);
      });
    }

    this._pollingRequest.send();
  };


  window.Marionette.Backends.HttpdPolling = Httpd;

}(this));
