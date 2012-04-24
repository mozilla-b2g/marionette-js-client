(function(exports){
  if(typeof(exports.TestAgent) === 'undefined'){
    exports.TestAgent = {};
  }

  /**
   * Constructor
   *
   * @param {Object} list of events to add onto responder
   */
  var Responder = exports.TestAgent.Responder = function(events){
    this.events = {};

    if(typeof(events) !== 'undefined'){
      this.addEventListener(events);
    }
  };

  /**
   * Stringifies request to websocket
   *
   *
   * @param {String} command command name
   * @param {Object} data object to be sent over the wire
   * @return {String} json object
   */
  Responder.stringify = function(command, data){
    return JSON.stringify([command, data]);
  };

  /**
   * Parses request from WebSocket.
   *
   * @param {String} json json string to translate
   * @return {Object} object where .data is json data and .command is command name.
   */
  Responder.parse = function(json){
    var data;
    try {
      data = (json.forEach)? json : JSON.parse(json);
    } catch(e){
      throw new Error("Could not parse json: '" + json + '"');
    }

    return {event: data[0], data: data[1]};
  };

  Responder.prototype = {
    parse: Responder.parse,
    stringify: Responder.stringify,

    /**
     * Events on this instance
     *
     * @property events
     * @type Object
     */
    events: null,

    /**
     * Recieves json string event and dispatches an event.
     *
     * @param {String} json
     * @param {Object} params... option number of params to pass to emit
     * @return {Object} result of WebSocketCommon.parse
     */
    respond: function(json){
      var event = Responder.parse(json),
          args = Array.prototype.slice.call(arguments).slice(1);

      args.unshift(event.data);
      args.unshift(event.event);

      this.emit.apply(this, args);

      return event;
    },

    //TODO: Extract event emitter logic

    /**
     * Adds an event listener to this object.
     *
     *
     * @param {String} type event name
     * @param {String} callback
     */
    addEventListener: function(type, callback){
      var event;

      if(typeof(callback) === 'undefined' && typeof(type) === 'object'){
        for(event in type){
          if(type.hasOwnProperty(event)){
            this.addEventListener(event, type[event]);
          }
        }

        return this;
      }

      if(!(type in this.events)){
        this.events[type] = [];
      }

      this.events[type].push(callback);

      return this;
    },

    /**
     * Emits an event.
     *
     * Accepts any number of additional arguments to pass unto
     * event listener.
     *
     * @param {String} eventName
     * @param {Arg...}
     */
    emit: function(){
      var args = Array.prototype.slice.call(arguments),
          event = args.shift(),
          eventList,
          self = this;

      if(event in this.events){
        eventList = this.events[event];

        eventList.forEach(function(callback){
          callback.apply(self, args);
        });
      }

      return this;
    },

    /**
     * Removes all event listeners for a given event type
     *
     *
     * @param {String} event
     */
    removeAllEventListeners: function(name){
      if(name in this.events){
        //reuse array
        this.events[name].length = 0;
      }

      return this;
    },

    /**
     * Removes a single event listener from a given event type
     * and callback function.
     *
     *
     * @param {String} eventName event name
     * @param {Function} callback
     */
    removeEventListener: function(name, callback){
      var i, length, events;

      if(!(name in this.events)){
        return false;
      }

      events = this.events[name];

      for(i = 0, length = events.length; i < length; i++){
        if(events[i] && events[i] === callback){
          events.splice(i, 1);
          return true;
        }
      }

      return false;
    }

  };

  Responder.prototype.on = Responder.prototype.addEventListener;

}(
  (typeof(window) === 'undefined')? module.exports : window
));

(function(window){

  'use strict';

  if(typeof(window.TestAgent) === 'undefined'){
    window.TestAgent = {};
  }

  var Loader = window.TestAgent.Loader = function(options){
    var key;

    this._cached = {};
    this.doneCallbacks = [];
    this.pending = 0;

    if(typeof(options) === 'undefined'){
      options = {};
    }

    for(key in options){
      if(options.hasOwnProperty(key)){
        this[key] = options[key];
      }
    }
  };

  Loader.prototype = {

    /**
     * Prefix for all loaded files
     *
     * @type String
     * @property prefix
     */
    prefix: '',

    /**
     * When true will add timestamps to required urls via query param
     *
     * @type Boolean
     * @property bustCache
     */
    bustCache: true,

    /**
     * Current window in which required files will be injected.
     *
     * @private
     * @property targetWindow
     * @type Window
     */
    _targetWindow: window,

    /**
     * Cached urls
     *
     * @property _cached
     * @type Object
     * @private
     */
    _cached: null,

    get targetWindow(){
      return this._targetWindow;
    },

    set targetWindow(value){
      this._targetWindow = value;
      this._cached = {};
    },

    /**
     * _decrements pending and fires done callbacks
     */
    _decrementPending: function(){
      if(this.pending > 0){
        this.pending--;
      }

      if(this.pending <= 0){
        this._fireCallbacks();
      }
    },

    _fireCallbacks: function(){
      var callback;
      while((callback = this.doneCallbacks.shift())){
        callback();
      }
    },

    /**
     * Adds a done callback
     *
     *
     * @param {Function} callback
     */
    done: function(callback){
      this.doneCallbacks.push(callback);
      return this;
    },

    /**
     * Loads given script into current target window.
     * If file has been previously loaded it will not
     * be loaded again.
     *
     * @param {String} url
     * @param {String} callback
     */
    require: function(url, callback){
      var prefix = this.prefix,
          suffix = '',
          self = this,
          element,
          document = this.targetWindow.document;

      if(url in this._cached){
        //url is cached we are good
        return;
      }

      if(this.bustCache){
        suffix = '?time=' + String(Date.now()) + '&rand=' + String(Math.random() * 1000);
      }

      this._cached[url] = true;

      var args = arguments;

      url = prefix + url + suffix;
      element = document.createElement('script');
      element.src = url;
      element.async = false;
      element.type = 'text/javascript';
      element.onload = function(){
        if(callback){
          callback();
        }
        self._decrementPending();
      };

      this.pending++;

      document.getElementsByTagName('head')[0].appendChild(element);
    }

  };

}(this));
(function(window){

  'use strict';

  if(typeof(window.TestAgent) === 'undefined'){
    window.TestAgent = {};
  }

  var Sandbox = window.TestAgent.Sandbox = function(url){
    this.url = url;
  };

  Sandbox.prototype = {

    _element: null,

    /**
     * @property ready
     * @type Boolean
     *
     * True when sandbox is ready
     */
    ready: false,

    /**
     * URL for the iframe sandbox.
     *
     * @return String
     */
    url: null,

    /**
     * Returns iframe element.
     *
     *
     * @return DOMElement
     */
    getElement: function(){
      var iframe;
      if(!this._element){
        iframe = this._element = window.document.createElement('iframe');
        iframe.src = this.url + '?time=' + String(Date.now());
      }
      return this._element;
    },

    run: function(callback){
      //cleanup old sandboxes
      this.destroy();

      var element = this.getElement(),
          self = this;

      //this must come before the listener
      window.document.body.appendChild(element);
      element.contentWindow.addEventListener('DOMContentLoaded', function(){
        self.ready = true;
        callback.call(this);
      });
    },

    destroy: function(){
      var el;

      if(!this.ready){
        return false;
      }


      this.ready = false;

      el = this.getElement();
      el.parentNode.removeChild(el);


      return true;
    },

    getWindow: function(){
      if(!this.ready){
        return false;
      }

      return this.getElement().contentWindow;
    }

  };

}(this));
(function(window){

  'use strict';

  if(typeof(window.TestAgent) === 'undefined'){
    window.TestAgent = {};
  }

  var Server = window.TestAgent.Config = function(options){
    var key;

    for(key in options){
       if(options.hasOwnProperty(key)){
        this[key] = options[key];
       }
    }
  };

  Server.prototype = {
    /**
     * URL to the json fiel which contains
     * a list of files to load.
     *
     *
     * @property url
     * @type String
     */
    url: '',

    /**
     * Ready is true when resources have been loaded
     *
     *
     * @type Boolean
     * @property ready
     */
    ready: false,

    /**
     * List of test resources.
     *
     * @property resources
     * @type Array
     */
    resources: [],

    /**
     * Parse XHR response
     *
     * @param Object xhr xhr object
     */
    _parseResponse: function(xhr){
      var response;

      if(xhr.responseText){
        response = JSON.parse(xhr.responseText);
        //only return files for now...
        return response;
      }

      return {
        tests: []
      };
    },

    /**
     * Loads list of files from url
     *
     */
    load: function(callback){
      var xhr = new XMLHttpRequest(),
          self = this,
          response;

      xhr.open('GET', this.url, true);
      xhr.onreadystatechange = function(){
        if(xhr.readyState === 4){
          if(xhr.status === 200 || xhr.status === 0){
            response = self._parseResponse(xhr);

            self.ready = true;
            self.resources = response.tests;

            callback.call(this, response);
          } else {
            throw new Error('Could not fetch tests from "' + self.url  + '"');
          }
        } else {
        }
      };

      xhr.send(null);
    }
  };

  //backwards compat
  Server.prototype._loadResource = Server.prototype.load;

}(this));

//depends on TestAgent.Responder
(function(exports){
  if(typeof(exports.TestAgent) === 'undefined'){
    exports.TestAgent = {};
  }

  var Native, Responder;

  //Hack Arounds for node
  if(typeof(window) === 'undefined'){
    Native = require('ws');
    Responder = require('./responder').TestAgent.Responder;
  }

  Responder = Responder || TestAgent.Responder;
  Native = (Native || WebSocket || MozWebSocket);

  //end


  /**
   * Creates a websocket client handles custom
   * events via responders and auto-reconnect.
   *
   * Basic Options:
   *  - url: websocekt endpoint (for example: "ws://localhost:8888")
   *
   * Options for retries:
   *
   *  - retry (false by default)
   *  - retries (current number of retries)
   *  - retryLimit ( number of retries before error is thrown Infinity by default)
   *  - retryTimeout ( Time between retries 3000ms by default)
   *
   *
   * @param {Object} options
   */
  var Client = exports.TestAgent.WebsocketClient = function(options){
    var key;
    for(key in options){
      if(options.hasOwnProperty(key)){
        this[key] = options[key];
      }
    }
    Responder.call(this);

    this.on('close', this._incrementRetry.bind(this));
    this.on('message', this._processMessage.bind(this));
    this.on('open', this._clearRetries.bind(this));
  };

  Client.RetryError = function(){
    Error.apply(this, arguments);
  };

  Client.RetryError.prototype = Object.create(Error.prototype);

  Client.prototype = Object.create(Responder.prototype);
  Client.prototype.Native = Native;

  Client.prototype.proxyEvents = ['open', 'close', 'message'];

  //Retry
  Client.prototype.retry = false;
  Client.prototype.retries = 0;
  Client.prototype.retryLimit = Infinity;
  Client.prototype.retryTimeout = 3000;

  Client.prototype.start = function(){
    var i, event;

    if(this.retry && this.retries >= this.retryLimit){
      throw new Client.RetryError('Retry limit has been reach retried ' + String(this.retries) + ' times');
    }

    this.socket = new this.Native(this.url);

    for(i = 0; i < this.proxyEvents.length; i++){
      event = this.proxyEvents[i];
      this.socket.addEventListener(event, this._proxyEvent.bind(this, event));
    }

    this.emit('start', this);
  };

  /**
   * Sends Responder encoded event to the server.
   *
   * @param {String} event
   * @param {String} data
   */
  Client.prototype.send = function(event, data){
    this.socket.send(this.stringify(event, data));
  };

  Client.prototype._incrementRetry = function(){
    if(this.retry){
      this.retries++;
      setTimeout(this.start.bind(this), this.retryTimeout);
    }
  };

  Client.prototype._processMessage = function(message){
    if(message.data){
      message = message.data;
    }
    this.respond(message, this);
  };

  Client.prototype._clearRetries = function(){
    this.retries = 0;
  };

  Client.prototype._proxyEvent = function(){
    this.emit.apply(this, arguments);
  };

}(
  (typeof(window) === 'undefined')? module.exports : window
));
(function(window){
  if(typeof(window.TestAgent) === 'undefined'){
    window.TestAgent = {};
  }

  if(typeof(window.TestAgent.Mocha) === 'undefined'){
    window.TestAgent.Mocha = {};
  }

  Base.slow = 75;

  //Credit: mocha - https://github.com/visionmedia/mocha/blob/master/lib/reporters/base.js#L194
  function Base(runner) {
    var self = this
      , stats = this.stats = { suites: 0, tests: 0, passes: 0, pending: 0, failures: 0 }
      , failures = this.failures = [];

    if (!runner) return;
    this.runner = runner;

    runner.on('start', function(){
      stats.start = new Date;
    });

    runner.on('suite', function(suite){
      stats.suites = stats.suites || 0;
      suite.root || stats.suites++;
    });

    runner.on('test end', function(test){
      stats.tests = stats.tests || 0;
      stats.tests++;
    });

    runner.on('pass', function(test){
      stats.passes = stats.passes || 0;

      var medium = Base.slow / 2;
      test.speed = test.duration > Base.slow
        ? 'slow'
        : test.duration > medium
          ? 'medium'
          : 'fast';

      stats.passes++;
    });

    runner.on('fail', function(test, err){
      stats.failures = stats.failures || 0;
      stats.failures++;
      test.err = err;
      failures.push(test);
    });

    runner.on('end', function(){
      stats.end = new Date;
      stats.duration = new Date - stats.start;
    });

    runner.on('pending', function(){
      stats.pending++;
    });
  }

  window.TestAgent.Mocha.ReporterBase = Base;

}(this));
(function(window){

  if(typeof(window.TestAgent) === 'undefined'){
    window.TestAgent = {};
  }

  if(typeof(window.TestAgent.Mocha) === 'undefined'){
    window.TestAgent.Mocha = {};
  }

  var Base = TestAgent.Mocha.ReporterBase,
      exports = window.TestAgent.Mocha,
      log = console.log.bind(console);

  MochaReporter.console = window.console;
  MochaReporter.send = function(){};

  //TODO -- Buffer console.log calls

  function MochaReporter(runner) {
    Base.call(this, runner);

    var self = this,
        stats = this.stats,
        total = runner.total,
        indentation = -1,
        suiteTitle,
        currentTest;

    MochaReporter.console.log = function(){
      //real console log
      log.apply(this, arguments);

      //for server

      var stack, messages = Array.prototype.slice.call(arguments).map(function(item){
        if(!item){
          return item;
        }
        return (item.toString)? item.toString() : item;
      });

      try {
        throw new Error();
      } catch (e){
        stack = e.stack;
      }

      //re-orgnaize the stack to exlude the above
      stack = stack.split("\n").map(function(e){
        return e.trim().replace(/^at /, '');
      });

      stack.splice(0, 1);
      stack = stack.join("\n");

      //this is temp
      MochaReporter.send(JSON.stringify(['log', {messages: messages, stack: stack}]));
    };

    runner.on('suite', function(suite){
      indentation++;
      MochaReporter.send(JSON.stringify(['suite', jsonExport(suite, { indentation: indentation }) ]));
    });

    runner.on('suite end', function(suite){
      MochaReporter.send(JSON.stringify(['suite end', jsonExport(suite, { indentation: indentation }) ]));
      indentation--;
    });

    runner.on('test', function(test){
      MochaReporter.send(JSON.stringify(['test', jsonExport(test) ]));
    });

    runner.on('test end', function(test){
      MochaReporter.send(JSON.stringify(['test end', jsonExport(test) ]));
    });

    runner.on('start', function(){
      MochaReporter.send( JSON.stringify(['start', { total: total }]) );
    });

    runner.on('pass', function(test){
      MochaReporter.send(JSON.stringify(['pass', jsonExport(test)]));
    });

    runner.on('fail', function(test, err){
      MochaReporter.send(JSON.stringify(['fail', jsonExport(test, {err: jsonErrorExport(err) })]));
    });

    runner.on('end', function(){
      MochaReporter.send(JSON.stringify(['end', self.stats]));
    });
  }

  var exportKeys = [
    'title',
    'getTitle',
    'fullTitle',
    'root',
    'duration',
    'state'
  ];

  function jsonErrorExport(err){
    var result = {};

    result.stack = err.stack;
    result.message = err.message;
    result.type = err.type;
    result.constructorName = err.constructor.name;
    result.expected = err.expected;
    result.actual = err.actual;

    return result;
  }

  function jsonExport(object, additional) {
    var result = {}, key;

    exportKeys.forEach(function(key){
      var value;
      if(key in object){
        value = object[key];

        if(typeof(value) === 'function'){
          result[key] = object[key]();
        } else {
          result[key] = value;
        }
      }
    });

    if(typeof(additional) !== 'undefined'){
      for(key in additional){
        if(additional.hasOwnProperty(key)){
          result[key] = additional[key];
        }
      }
    }
    return result;
  }

  //export
  exports.JsonStreamReporter = MochaReporter;

}(this));

(function(window){

  if(typeof(window.TestAgent) === 'undefined'){
    window.TestAgent = {};
  }

  TestAgent.BrowserWorker = function(options){

    if(typeof(options) === 'undefined'){
      options = {};
    }

    this.deps.Server.call(
      this,
      options.server || this.defaults.server
    );

    this.sandbox = new this.deps.Sandbox(
      options.sandbox || this.defaults.sandbox
    );

    this.loader = new this.deps.Loader(
      options.loader || this.defaults.loader
    );


    this._testsProcessor = [];
    this.testRunner = options.testRunner;
  };

  //inheritance
  TestAgent.BrowserWorker.prototype = Object.create(
    TestAgent.WebsocketClient.prototype
  );

  var proto = TestAgent.BrowserWorker.prototype;

  proto.deps = {
    Server: TestAgent.WebsocketClient,
    Sandbox: TestAgent.Sandbox,
    Loader: TestAgent.Loader,
    ConfigLoader: TestAgent.Config
  };

  proto.defaults = {
    server: {
      retry: true,
      url: 'ws://' + document.location.host.split(':')[0] + ':8789'
    }
  };

  /**
   * Create a new sandbox instance and set
   * loader to use it as its target.
   *
   * @param {Function} callback
   */
  proto.createSandbox = function(callback){
    var self = this;
    this.sandbox.run(function(){
      self.loader.targetWindow = this;
      if(callback){
        if(!('require' in this)){
          this.require = self.loader.require.bind(self.loader);
        }
        callback.call(this, self.loader);
        self.emit('sandbox', this, self.loader);
      }
    });
  };

  proto._emitTestComplete = function(){
    var args = Array.prototype.slice.call(arguments);
    args.unshift('run tests complete');
    this.emit.apply(this, args);
  };

  /**
   * Adds function which will reduce the test files given to runTests.
   * Each filter much return an array of tests.
   *
   *    worker.addTestsProcessor(function(tests){
   *      return tests;
   *    });
   *
   * @param {Function} callback
   * @chainable
   */
  proto.addTestsProcessor = function(callback){
    this._testsProcessor.push(callback);
  };


  /**
   * Runs tests through all testsProcessor reducers.
   *
   *
   * @param {Array} tests
   */
  proto._processTests = function(tests){
    var result = tests,
        reducers = this._testsProcessor,
        length = reducers.length,
        i = 0;

    for(; i < length; i++){
      result = reducers[i](result);
    }

    return result;
  };

  /**
   * Builds sandbox executes the .testRunner function.
   *
   * @param {Array} tests
   */
  proto.runTests = function(tests){
    var self = this,
        done = this._emitTestComplete.bind(this);

    if(!this.testRunner){
      throw new Error("Worker must be provided a .testRunner method");
    }

    this.createSandbox(function(){
      self.testRunner(self, self._processTests(tests), done);
    });
  };

  /**
   * Enhances worker with functionality from class.
   *
   *    Enhancement = function(options){}
   *    Enhancement.prototype.enhance = function(server){
   *      //do stuff
   *    }
   *
   *    //second argument passed to constructor
   *    worker.enhance(Enhancement, {isBlue: true});
   *
   *
   * @param {Object} enhancement
   * @param {Object} options
   * @chainable
   */
  proto.use = function(enhancement, options){
    new enhancement(options).enhance(this);

    return this;
  };

}(this));
(function(window){
  function MochaDriver (options) {
    var key;

    if(typeof(options) === 'undefined'){
      options = {};
    }

    for(key in options){
      if(options.hasOwnProperty(key)){
        this[key] = options[key];
      }
    }
  }

  MochaDriver.createMutliReporter = function(){
    var reporters = Array.prototype.slice.call(arguments);

    return function(runner){
      reporters.forEach(function(Report){
        new Report(runner);
      });
    };
  };

  MochaDriver.prototype = {
    ui: 'bdd',
    testHelperUrl: './test/helper.js',
    mochaUrl: './vendor/mocha/mocha.js',

    enhance: function(worker){
      this.worker = worker;
      worker.testRunner = this._testRunner.bind(this);
      worker.on('run tests', this._onRunTests.bind(this));
    },

    _onRunTests: function(data){
      this.worker.runTests(data.tests || []);
    },

    getReporter: function(box){
      var stream = TestAgent.Mocha.JsonStreamReporter,
          self = this;

      stream.console = box.console;

      stream.send = function(line){
        self.worker.send('test data', line);
      };

      return MochaDriver.createMutliReporter(
        TestAgent.Mocha.JsonStreamReporter,
        box.mocha.reporters.HTML
      );
    },

    _testRunner: function(worker, tests, done){
      var box = worker.sandbox.getWindow(),
          self = this;

      worker.loader.done(function(){
        box.mocha.run(done);
      });

      box.require(this.mochaUrl, function(){
        //setup mocha
        box.mocha.setup({
          ui: self.ui,
          reporter: self.getReporter(box)
        });
      });

      box.require(this.testHelperUrl);

      tests.forEach(function(test){
        box.require(test);
      });
    }

  };

  window.TestAgent.BrowserWorker.MochaDriver = MochaDriver;

}(this));
(function(window){


  var Worker = window.TestAgent.BrowserWorker;


  Worker.Config = function(options){
    if(typeof(options) === 'undefined'){
      options = {};
    }

    this.config = new TestAgent.Config(options);
  };

  Worker.Config.prototype = {
    enhance: function(worker){
      worker.config = this._config.bind(this, worker, this.config);
    },

    _config: function(worker, config, callback){
      config.load(function(data){
        worker.emit('config', data);
        if(callback){
          callback(data);
        }
      });
    }

  };

}(this));
(function(window){

  var FORMAT_REGEX = /%([0-9])?s/g;

  function format(){
    var i = 0,
        str,
        args = Array.prototype.slice.call(arguments),
        result;

    str = args.shift();

    result = str.replace(FORMAT_REGEX, function(match, pos){
      var index = parseInt(pos || i++, 10);
      return args[index];
    });

    return result;
  }

  function fragment(){
    var string = format.apply(this, arguments),
        element = document.createElement('div');

    element.innerHTML = string;
    return element.firstChild;
  }

  var TestUi = window.TestAgent.BrowserWorker.TestUi = function(options){
    var selector;

    if(typeof(options) === 'undefined'){
      options = {};
    }

    selector = options.selector || '#test-agent-ui';
    this.element = options.element || document.querySelector(selector);
    this.queue = {};
  };


  TestUi.prototype = {
    templates: {
      testList: '<ul class="test-agent"></ul>',
      testItem: '<li data-url="%s">%s</li>',
      testRun: '<button class="run-tests">Execute</button>'
    },

    enhance: function(worker){
      this.worker = worker;
      this.worker.on('config', this.onConfig.bind(this));
    },

    onConfig: function(data){
      //purge elements
      var elements = this.element.getElementsByTagName('*'),
          element,
          templates = this.templates,
          i = 0,
          parent;

      for(; i < elements.length; i++){
        element = elements[i];
        element.parentNode.removeChild(element);
      }

      parent = fragment(templates.testList);

      data.tests.forEach(function(test){
        parent.appendChild(fragment(
          templates.testItem,
          test,
          test
        ));
      });

      this.element.appendChild(
        parent
      );

      this.element.appendChild(fragment(templates.testRun));

      this.initDomEvents();
    },

    initDomEvents: function(){
      var ul = this.element.querySelector('ul'),
          button = this.element.querySelector('button'),
          self = this,
          activeClass = ' active';

      ul.addEventListener('click', function(e){
        var target = e.target,
            url = target.getAttribute('data-url');

        if(url){
          if(self.queue[url]){
            target.className = target.className.replace(activeClass, '');
            delete self.queue[url];
          } else {
            target.className += activeClass;
            self.queue[url] = true;
          }
        }
      });

      button.addEventListener('click', function(){
        var tests = [], key;

        for(key in self.queue){
          if(self.queue.hasOwnProperty(key)){
            tests.push(key);
          }
        }
        self.worker.emit('run tests', {tests: tests});
      });
    }

  };

}(this));
