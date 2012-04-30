(function(window) {


  if (typeof(window.Marionette) === 'undefined') {
    window.Marionette = {};
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
    xhrClass: XMLHttpRequest,
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

  window.Marionette.Xhr = Xhr;

}(this));
(function(exports) {
  if (typeof(exports.Marionette) === 'undefined') {
    exports.Marionette = {};
  }

  if (typeof(exports.Marionette.Drivers) === 'undefined') {
    exports.Marionette.Drivers = {};
  }

  function Abstract(options) {
    this._sendQueue = [];
    this._responseQueue = [];
  }

  Abstract.prototype = {

    /**
     * Timeout for commands
     *
     * @type Numeric
     */
    timeout: 10000,

    /**
     * Waiting for a command to finish?
     *
     * @type Boolean
     */
    _waiting: false,

    /**
     * Is system ready for commands?
     *
     * @type Boolean
     */
    ready: false,

    /**
     * Connection id for the server.
     *
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
     * @param {Object} command remote command to send to marionette.
     * @param {Function} callback executed when response comes back.
     */
    send: function send(cmd, callback) {
      if (!this.ready) {
        throw new Error('connection is not ready');
      }

      if (typeof(callback) === 'undefined') {
        throw new Error('callback is required');
      }

      this._responseQueue.push(callback);
      this._sendQueue.push(cmd);

      this._nextCommand();

      return this;
    },

    /**
     * Connects to a remote server.
     * Requires a _connect function to be defined.
     * Example:
     *
     *    MyClass.prototype._connect = function _connect(){
     *      //open a socket to marrionete accept response
     *      //you *must* call _onDeviceResponse with the first
     *      //response from marionette it looks like this:
     *      //{ from: 'root', applicationType: 'gecko', traits: [] }
     *      this.connectionId = result.id;
     *    }
     *
     * @param {Function} callback \
     *  executes after successfully connecting to the server.
     */
    connect: function connect(callback) {
      this.ready = true;
      this._responseQueue.push(function(data) {
        this.applicationType = data.applicationType;
        this.traits = data.traits;
        callback();
      }.bind(this));
      this._connect();
    },

    /**
     * Checks queue if not waiting for a response
     * Sends command to websocket server
     *
     * @private
     */
    _nextCommand: function _nextCommand() {
      if (!this._waiting && this._sendQueue.length) {
        this._waiting = true;
        this._sendCommand(this._sendQueue.shift());
      }
    },

    /**
     * Handles responses from devices.
     * Will only respond to the event if the connectionId
     * is equal to the event id and the client is ready.
     *
     * @param {Object} data response from server.
     * @private
     */
    _onDeviceResponse: function _onDeviceResponse(data) {
      var cb;
      if (this.ready && data.id === this.connectionId) {
        cb = this._responseQueue.shift();
        cb(data.response);

        this._waiting = false;
        this._nextCommand();
      }
    }

  };

  exports.Marionette.Drivers.Abstract = Abstract;

}(
  (typeof(window) === 'undefined') ? module.exports : window
));
(function(exports) {
  if (typeof(exports.Marionette) === 'undefined') {
    exports.Marionette = {};
  }

  if (typeof(exports.Marionette.Drivers) === 'undefined') {
    exports.Marionette.Drivers = {};
  }

  if (typeof(TestAgent) === 'undefined') {
    TestAgent = require('test-agent/lib/test-agent/websocket-client').TestAgent;
  }

  var Abstract;

  if (typeof(window) === 'undefined') {
    Abstract = require('./abstract').Marionette.Drivers.Abstract;
  } else {
    Abstract = Marionette.Drivers.Abstract;
  }

  function Websocket(options) {
    Abstract.call(this, options);

    this.client = new TestAgent.WebsocketClient(options);
    this.client.on('device response', this._onDeviceResponse.bind(this));
  }

  Websocket.prototype = Object.create(Abstract.prototype);

  /**
   * Sends a command to the websocket server.
   *
   * @param {Object} command remote marionette command.
   * @private
   */
  Websocket.prototype._sendCommand = function _sendCommand(cmd) {
    this.client.send('device command', {
      id: this.connectionId,
      command: cmd
    });
  };

  /**
   * Opens a connection to the websocket server and creates
   * a device connection.
   *
   * @param {Function} callback sent when initial response comes back.
   */
  Websocket.prototype.connect = function connect(callback) {
    var self = this;

    this.client.start();

    this.client.on('open', function wsOpen() {

      //because I was lazy and did not implement once
      function connected(data) {
        self.client.removeEventListener('device ready', connected);
        self.connectionId = data.id;
      }

      function open(data) {
        if (data.id === self.connectionId) {
          var result = self.client.removeEventListener('device response', open);
          self.ready = true;
          callback(data.response);
        }
      }

      //order is important
      self.client.removeEventListener('open', wsOpen);
      self.client.on('device ready', connected);
      self.client.on('device response', open);

      self.client.send('device create');

    });

  };

  exports.Marionette.Drivers.Websocket = Websocket;

}(
  (typeof(window) === 'undefined') ? module.exports : window
));
(function(window) {

  if (typeof(window.Marionette) === 'undefined') {
    window.Marionette = {};
  }

  if (typeof(window.Marionette.Drivers) === 'undefined') {
    window.Marionette.Drivers = {};
  }

  var Abstract = Marionette.Drivers.Abstract;

  function Httpd(options) {
    var key;
    if (typeof(options) === 'undefined') {
      options = options;
    }

    Abstract.call(this);

    for (key in options) {
      if (options.hasOwnProperty(key)) {
        this[key] = options[key];
      }
    }
  }

  var proto = Httpd.prototype = Object.create(Abstract.prototype);

  /**
   * Location of the http server that will proxy to marionette
   *
   * @type String
   */
  proto.proxyUrl = '/marionette';

  /**
   * Port that proxy should connect to.
   *
   * @type Numeric
   */
  proto.port = 2828;

  /**
   * Server proxy should connect to.
   *
   *
   * @type String
   */
  proto.server = 'localhost';

  /**
   * Sends command to server for this connection
   *
   * @this
   * @param {Object} command remote marionette command.
   */
  proto._sendCommand = function _sendCommand(command) {
    this._request('PUT', command, function() {
      //error handling?
    });
  };

  /**
   * Opens connection for device.
   * @this
   */
  proto._connect = function _connect() {
    var auth = {
      server: this.server,
      port: this.port
    };

    this._request('POST', auth, function(data, xhr) {
      var deviceResponse = this._onQueueResponse.bind(this);
      if (xhr.status === 200) {
        this.connectionId = data.id;
        this._pollingRequest = this._request('GET', deviceResponse);
      } else {
        //throw error
      }
    }.bind(this));
  };

  /**
   * Creates xhr request
   *
   *
   * @this
   * @param {String} method http method like 'POST' or 'GET'.
   * @param {Object} data optional.
   * @param {Object} callback after xhr completes \
   * receives parsed data as first argument and xhr object as second.
   * @return {Marionette.Xhr} xhr wrapper.
   */
  proto._request = function _request(method, data, callback) {
    var request, url;

    if (typeof(callback) === 'undefined' && typeof(data) === 'function') {
      callback = data;
      data = null;
    }

    url = this.proxyUrl;

    if (this.connectionId !== null) {
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
   * @this
   * @param {Object} queue list of messages.
   * @param {Marionette.Xhr} xhr xhr instance.
   */
  proto._onQueueResponse = function _onQueueResponse(queue, xhr) {
    var self = this;

    if (xhr.status !== 200) {
      throw new Error('XHR responded with code other then 200');
    }

    //TODO: handle errors
    if (queue && queue.messages) {
      queue.messages.forEach(function(response) {
        self._onDeviceResponse(response);
      });
    }

    this._pollingRequest.send();
  };


  window.Marionette.Drivers.HttpdPolling = Httpd;

}(this));
(function(exports) {
  if (typeof(exports.Marionette) === 'undefined') {
    exports.Marionette = {};
  }

  function Element(id, client) {
    this.id = id;
    this.client = client;
  }

  Element.prototype = {

    /**
     * Sends remote command processes the result.
     * Appends element id to each command.
     *
     * @param {Object} command marionette request.
     * @param {String} responseKey key in the response to pass to callback.
     * @param {Function} callback callback function receives the result of
     *                            response[responseKey] as its first argument.
     *
     * @return {Object} self.
     */
    _sendCommand: function(command, responseKey, callback) {
      if (!command.element) {
        command.element = this.id;
      }

      this.client._sendCommand(command, responseKey, callback);
      return this;
    },

    /**
     * Finds a single child of this element.
     *
     * @param {String} query search string.
     * @param {String} method search method.
     * @param {Function} callback element callback.
     * @return {Object} self.
     */
    findElement: function findElement(query, method, callback) {
      this.client.findElement(query, method, this.id, callback);
      return this;
    },

    /**
     * Finds a all children of this element that match a pattern.
     *
     * @param {String} query search string.
     * @param {String} method search method.
     * @param {Function} callback element callback.
     * @return {Object} self.
     */
    findElements: function findElement(query, method, callback) {
      this.client.findElements(query, method, this.id, callback);
      return this;
    },

    /**
     * Checks to see if two elements are equal
     *
     * @param {String|Marionette.Element} element element to test.
     * @param {Function} callback called with boolean.
     * @return {Object} self.
     */
    equals: function equals(element, callback) {

      if (element instanceof this.constructor) {
        element = element.id;
      }

      var cmd = {
        type: 'elementsEqual',
        elements: [this.id, element]
      };
      this.client._sendCommand(cmd, 'value', callback);
      return this;
    },

    /**
     * Gets attribute value for element.
     *
     * @param {String} attr attribtue name.
     * @param {Function} callback gets called with attribute's value.
     * @return {Object} self.
     */
    getAttribute: function getAttribute(attr, callback) {
      var cmd = {
        type: 'getAttribute',
        name: attr
      };

      return this._sendCommand(cmd, 'value', callback);
    },

    /**
     * Sends typing event keys to element.
     *
     *
     * @param {String} string message to type.
     * @param {Function} callback boolean success.
     * @return {Object} self.
     */
    sendKeys: function sendKeys(string, callback) {
      var cmd = {
        type: 'sendKeysToElement',
        value: string
      };
      return this._sendCommand(cmd, 'ok', callback);
    },

    /**
     * Clicks element.
     *
     * @param {Function} callback boolean result.
     * @return {Object} self.
     */
    click: function click(callback) {
      var cmd = {
        type: 'clickElement'
      };
      return this._sendCommand(cmd, 'ok', callback);
    },

    /**
     * Gets text of element
     *
     *
     * @param {Function} callback text of element.
     * @return {Object} self.
     */
    text: function text(callback) {
      var cmd = {
        type: 'getElementText'
      };
      return this._sendCommand(cmd, 'value', callback);
    },

    /**
     * Gets value of element
     *
     *
     * @param {Function} callback value of element.
     * @return {Object} self.
     */
    value: function value(callback) {
      var cmd = {
        type: 'getElementValue'
      };
      return this._sendCommand(cmd, 'value', callback);
    },

    /**
     * Clears element.
     *
     *
     * @param {Function} callback value of element.
     * @return {Object} self.
     */
    clear: function clear(callback) {
      var cmd = {
        type: 'clearElement'
      };
      return this._sendCommand(cmd, 'ok', callback);
    },

    /**
     * Checks if element is selected.
     *
     *
     * @param {Function} callback boolean argument.
     * @return {Object} self.
     */
    selected: function selected(callback) {
      var cmd = {
        type: 'isElementSelected'
      };
      return this._sendCommand(cmd, 'value', callback);
    },

    /**
     * Checks if element is enabled.
     *
     *
     * @param {Function} callback boolean argument.
     * @return {Object} self.
     */
    enabled: function enabled(callback) {
      var cmd = {
        type: 'isElementEnabled'
      };
      return this._sendCommand(cmd, 'value', callback);
    },

    /**
     * Checks if element is displayed.
     *
     *
     * @param {Function} callback boolean argument.
     * @return {Object} self.
     */
    displayed: function displayed(callback) {
      var cmd = {
        type: 'isElementDisplayed'
      };
      return this._sendCommand(cmd, 'value', callback);
    }

  };

  exports.Marionette.Element = Element;

}(
  (typeof(window) === 'undefined') ? module.exports : window
));
(function(exports) {
  if (typeof(exports.Marionette) === 'undefined') {
    exports.Marionette = {};
  }

  var Element;

  if (exports.Marionette.Element) {
    Element = exports.Marionette.Element;
  } else if (typeof(window) === 'undefined') {
    Element = require('./element').Marionette.Element;
  }

  var key;
  var searchMethods = {
    CLASS: 'class name',
    SELECTOR: 'css selector',
    ID: 'id',
    NAME: 'name',
    LINK_TEXT: 'link text',
    PARTIAL_LINK_TEXT: 'partial link text',
    TAG: 'tag name',
    XPATH: 'xpath'
  };

  function isFunction(value) {
    return typeof(value) === 'function';
  }

  function Client(driver) {
    this.driver = driver;
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

      this.driver.send(cmd, cb);

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
      var self = this, cmd;

      cmd = { type: 'getMarionetteID' };

      return this._sendCommand(cmd, 'id', function(actor) {
        self.actor = actor;
        if (callback) {
          callback(actor);
        }
      });
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
      return this._sendCommand(cmd, 'ok', callback);
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
      return this._sendCommand(cmd, 'ok', callback);
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
      throw new Error("This command is current unsupported.");
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
     * Finds element.
     *
     * @param {String} type type of command to send like 'findElement'.
     * @param {String} query search query.
     * @param {String} method search method.
     * @param {String} elementId id of element to search within.
     * @param {Function} callback executes with element uuid(s).
     */
    _findElement: function _findElement(type, query, method, id, callback) {
      var cmd, self = this;

      if (isFunction(id)) {
        callback = id;
        id = undefined;
      }

      if (isFunction(method)) {
        callback = method;
        method = undefined;
      }

      cmd = {
        type: type || 'findElement',
        using: method || 'css selector',
        value: query,
        element: id
      };

      if (this.searchMethods.indexOf(cmd.using) === -1) {
        throw new Error(
          'invalid option for using: \'' + cmd.using + '\' use one of : ' +
          this.searchMethods.join(', ')
        );
      }

      //proably should extract this function into a private
      return this._sendCommand(cmd, 'value', function processElements(result) {
        var element;
        if (result instanceof Array) {
          element = [];
          result.forEach(function(el) {
            element.push(new Element(el, self));
          });
        } else {
          element = new Element(result, self);
        }
        callback(element);
      });
    },

    /**
     * Finds element.
     *
     * @param {String} query search query.
     * @param {String} method search method.
     * @param {String} elementId id of element to search within.
     * @param {Function} callback executes with element uuid.
     */
    findElement: function findElement() {
      var args = Array.prototype.slice.call(arguments);
      args.unshift('findElement');
      return this._findElement.apply(this, args);
    },

    /**
     * Finds elements.
     *
     * @param {String} query search query.
     * @param {String} method search method.
     * @param {String} elementId id of element to search within.
     * @param {Function} callback executes with an array of element uuids.
     */
    findElements: function findElements() {
      var args = Array.prototype.slice.call(arguments);
      args.unshift('findElements');
      return this._findElement.apply(this, args);
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


  //gjslint: ignore
  Client.prototype.searchMethods = [];

  for (key in searchMethods) {
    if (searchMethods.hasOwnProperty(key)) {
      Client.prototype[key] = searchMethods[key];
      Client.prototype.searchMethods.push(searchMethods[key]);
    }
  }

  exports.Marionette.Client = Client;

}(
  (typeof(window) === 'undefined') ? module.exports : window
));
