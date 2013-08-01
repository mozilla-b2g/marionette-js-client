describe('marionette/client', function() {

  var subject, driver, cb, cbResponse,
      result, device, Element, Client, Exception;

  cross.require('element', function(obj) {
    Element = obj;
  });

  cross.require('error', function(obj) {
    Exception = obj;
  });

  cross.require('client', function(obj) {
    Client = obj;
  });

  device = new DeviceInteraction(exampleCmds, function() {
    return subject;
  });

  function commandCallback(data) {
    commandCallback.value = data;
  }

  beforeEach(function() {
    commandCallback.value = null;
    driver = new MockDriver();
    subject = new Client(driver);
    cb = function() {
      cbResponse = arguments;
    };
  });

  describe('initialization', function() {
    it('should save .driver', function() {
      expect(subject.driver).to.be(driver);
    });

    describe('without driver', function() {
      beforeEach(function() {
        subject = new Client(null, { lazy: true });
      });

      it('should not explode', function() {
        expect(subject.driver).not.to.be.ok();
      });
    });
  });

  describe('hooks', function() {

    it('should not fail running missing hooks', function(done) {
      subject.runHook('fakemissingyey', done);
    });

    it('should handle errors in hooks', function(done) {
      var myErr = new Error('err');
      // success
      subject.addHook('test', function(complete) {
        complete();
      });

      // failure
      subject.addHook('test', function(complete) {
        complete(myErr);
      });

      // after failure should not run
      subject.addHook('test', function(complete) {
        done(new Error('should not run hooks after error'));
      });

      subject.runHook('test', function(err) {
        expect(err).to.be(myErr);
        done();
      });
    });


    describe('success', function() {
      var called = [];

      function logSuccess(name) {
        return function(done) {
          process.nextTick(function() {
            called.push(name);
            done();
          });
        }
      }

      beforeEach(function() {
        called.length = 0;
      });

      it('should handle adding a hook in a hook', function(done) {
        var calledHook = false;
        subject.addHook('test', function(hookOne) {
          hookOne();
          subject.addHook('test', function(hookTwo) {
            calledHook = true;
            hookTwo();
          });
        });

        subject.runHook('test', function() {
          expect(calledHook).to.be.ok();
          done();
        });
      });

      it('should run in context of client', function(done) {
        subject.addHook('test', function(completeHook) {
          expect(subject).to.be(this);
          completeHook();
        });

        subject.runHook('test', done);
      });

      it('should run all hooks', function(done) {
        subject.addHook('test', logSuccess('one'))
               .addHook('test', logSuccess('two'))
               .addHook('test', logSuccess('three'));

        subject.runHook('test', function() {
          expect(called).to.eql(['one', 'two', 'three']);
          done();
        });
      });

    });
  });

  describe('.plugin', function() {
    it('should allow chaining', function() {
      var one = {},
          two = {};

      function pluginOne() {
        return one;
      }

      function pluginTwo() {
        return two;
      }

      subject.plugin('one', pluginOne).
              plugin('two', pluginTwo);

      expect(subject.one).to.be(one);
      expect(subject.two).to.be(two);
    });

    it('should invoke plugin without name', function() {
      var calledPlugin;
      var options = {};

      function plugin(client, opts) {
        expect(client).to.be(subject);
        expect(opts).to.be(options);
        calledPlugin = true;
      }

      subject.plugin(null, plugin, options);
      expect(calledPlugin).to.be.ok();
    });

    it('should assign result to the given name', function() {
      var myObj = {};
      function plugin() {
        return myObj;
      }

      subject.plugin('yey', plugin);
      expect(subject.yey).to.be(myObj);
    });

    it('should work with .setup', function() {
      var myObj = {};
      function plugin() {}
      plugin.setup = function() {
        return myObj;
      };

      subject.plugin('woot', plugin);
      expect(subject.woot).to.be(myObj);
    });
  });

  describe('._handleCallback', function() {
    var calledWith;

    function usesCallback() {

      it('should handle errors', function() {
        var calledWith, err;

        err = {
          status: 500,
          message: 'foo',
          stacktrace: 'bar'
        };

        subject._handleCallback(function() {
          calledWith = arguments;
        }, err, null);

        expect(calledWith[0]).to.be.a(
          Exception.GenericError
        );

        expect(calledWith[0].message).to.contain('foo');
      });

      it('should use callback when provided', function(done) {
        subject._handleCallback(function(err, val) {
          expect(err).to.be(1);
          expect(val).to.be(2);
          done();
        }, 1, 2);
      });
    }

    describe('with default', function() {

      beforeEach(function() {
        calledWith = null;
        subject.defaultCallback = function() {
          calledWith = arguments;
        };
      });

      it('should use default when no callback is provided', function() {
        subject._handleCallback(null, 1, 2);
        expect(calledWith).to.eql([1, 2]);
      });

      usesCallback();

    });

    usesCallback();
  });

  describe('.searchMethods', function() {
    it('should have a list of methods', function() {
      expect(subject.searchMethods).to.be.a(Array);
      expect(subject.searchMethods.length).to.be.greaterThan(3);
    });
  });

  describe('.send', function() {

    describe('when session: is present', function() {
      var result;
      beforeEach(function() {
        subject.session = 'session';
        subject.actor = 'actor';
        result = subject.send({ type: 'newSession' });
      });

      it('should be chainable', function() {
        expect(result).to.be(subject);
      });

      it('should add session to cmd', function() {
        expect(driver.sent[0]).to.eql({
          to: subject.actor,
          session: subject.session,
          type: 'newSession'
        });
      });
    });

    describe('when to: is not given', function() {

      describe('with an actor', function() {
        beforeEach(function() {
          subject.actor = 'foo';
          subject.send({ type: '_getActorId' }, cb);
        });

        it('should add to:', function() {
          expect(driver.sent[0]).to.eql({
            to: 'foo',
            type: '_getActorId'
          });
        });

      });

      describe('without an actor', function() {
        beforeEach(function() {
          subject.send({ type: '_getActorId' }, cb);
        });

        it('should add to:', function() {
          expect(driver.sent[0]).to.eql({
            to: 'root',
            type: '_getActorId'
          });
        });

      });

    });
  });

  describe('.scope', function() {
    describe('first subscope', function() {
      var scope;
      var options = {
        scriptTimeout: 150,
        searchTimeout: 175,
        context: 'chrome'
      };

      beforeEach(function() {
        scope = subject.scope(options);
        // trigger the new command.
        scope.goUrl();
      });

      Object.keys(options).forEach(function(key) {
        var value = options[key];
        it('should update .' + key, function() {
          expect(scope[key]).to.be(value);
          // has scoping changes
          expect(scope._scope[key]).to.be(value);
        });
      });

      it('should update the ._scope when state changes in scoped', function() {
        scope.setScriptTimeout(250);
        expect(scope._scope.scriptTimeout).to.be(250);
      });

      it('should not update sibling scope', function() {
        var sibling = subject.scope(options);
        sibling.setScriptTimeout(999);

        expect(sibling._scope.scriptTimeout).to.be(999);
        expect(scope._scope.scriptTimeout).not.to.be(999);
      });
    });
  });

  describe('.startSession', function() {
    var result;

    beforeEach(function(done) {
      var firesHook = false;

      subject.addHook('startSession', function(complete) {
        firesHook = true;
        complete();
      });

      result = subject.startSession(function() {
        expect(firesHook).to.be.ok();
        done();
      });

      driver.respond(exampleCmds.getMarionetteIDResponse());
      driver.respond(exampleCmds.newSessionResponse());
    });

    it('should be chainable', function() {
      expect(result).to.be(subject);
    });

    it('should have actor', function() {
      expect(subject.actor).to.be.ok();
    });

    it('should have a session', function() {
      expect(subject.session).to.be.ok();
    });
  });

  describe('._getActorId', function() {
    var response;

    device.
      issues('_getActorId').
      shouldSend({ type: 'getMarionetteID' }).
      serverResponds('getMarionetteIDResponse').
      callbackReceives('id');

    it('should save actor id', function() {
      expect(subject.actor).to.be(
        exampleCmds.getMarionetteIDResponse().id
      );
    });

  });

  describe('._sendCommand', function() {
    var cmd, response,
        calledTransform, result,
        calledWith;

    describe('on success', function() {

      beforeEach(function(done) {
        cmd = exampleCmds.getUrl();
        response = exampleCmds.getUrlResponse();

        calledTransform = false;
        subject._transformResultValue = function(value) {
          calledTransform = true;
          expect(value).to.be(response.value);
          return 'foo';
        };

        result = subject._sendCommand(cmd, 'value', function() {
          calledWith = arguments;
          done();
        });

        driver.respond(response);
      });

      it('should send given command and format the result', function() {
        expect(result).to.be(subject);
      });

      it('should send command through _transformResultValue', function() {
        expect(calledTransform).to.be(true);
        expect(calledWith[1]).to.be('foo');
      });

    });

    describe('on error', function() {

      beforeEach(function(done) {
        calledWith = null;
        cmd = exampleCmds.getUrl();
        response = exampleCmds.error();

        subject._sendCommand(cmd, 'value', function(err, data) {
          calledWith = arguments;
          done();
        });

        driver.respond(response);
      });

      it('should pass error to callback', function() {
        expect(calledWith[0]).to.be.ok();
        expect(calledWith[1]).to.not.be.ok();
      });

    });

  });


  describe('.deleteSession', function() {
    var result;
    var callsClose;

    beforeEach(function(done) {
      callsClose = false;
      var callsHook = false;

      subject.actor = '1';
      subject.session = 'sess';

      subject.driver.close = function() {
        expect(callsHook).to.be(true);
        callsClose = true;
      };

      subject.addHook('deleteSession', function(complete) {
        callsHook = true;
        complete();
        process.nextTick(function() {
          driver.respond(exampleCmds.ok());
        });
      });

      result = subject.deleteSession(done);
    });

    it('should clear session', function() {
      expect(subject.session).not.to.be.ok();
    });

    it('should set actor to null', function() {
      expect(subject.actor).not.to.be.ok();
    });

    it('should be chainable', function() {
      expect(result).to.be(subject);
    });

    it('should close the connection', function() {
      expect(callsClose).to.be(true);
    });
  });

  describe('.setSearchTimeout', function() {
    it('should have default .searchTimeout', function() {
      expect(subject.searchTimeout).to.be.ok();
    });
    describe('after setting', function() {
      device.
        issues('setSearchTimeout', 50).
        shouldSend({
          type: 'setSearchTimeout',
          value: 50
        }).
        serverResponds('ok').
        callbackReceives('ok');

      it('should set timeout', function() {
        expect(subject.searchTimeout).to.be(50);
      });
    });
  });

  describe('.getWindow', function() {
    device.
      issues('getWindow').
      shouldSend({
        type: 'getWindow'
      }).
      serverResponds('getWindowResponse').
      callbackReceives('value');
  });

  describe('.setContext', function() {
    it('should have a default context', function() {
      expect(subject.context).to.be('content');
    });

    describe('after setting context', function() {
      device.
        issues('setContext', 'chrome').
        shouldSend({
          type: 'setContext',
          value: 'chrome'
        }).
        serverResponds('ok').
        callbackReceives('ok');

      it('should remember context', function() {
        expect(subject.context).to.be('chrome');
      });
    });
  });

  describe('.getWindows', function() {
    device.
      issues('getWindows').
      shouldSend({
        type: 'getWindows'
      }).
      serverResponds('getWindowsResponse').
      callbackReceives('value');
  });

  describe('.switchToWindow', function() {
    device.
      issues('switchToWindow', '1-b2g').
      shouldSend({
        type: 'switchToWindow',
        value: '1-b2g'
      }).
      serverResponds('ok').
      callbackReceives('ok');
  });

  describe('.switchToFrame', function() {
    describe('when given nothing', function() {
      device.
        issues('switchToFrame').
        shouldSend({ type: 'switchToFrame' }).
        serverResponds('ok').
        callbackReceives('ok');
    });

    describe('when given an element', function() {
      var el;

      beforeEach(function() {
        el = new Element('77', subject);
        subject.switchToFrame(el, commandCallback);
      });

      device.
        shouldSend({
          type: 'switchToFrame',
          element: '77'
        }).
        serverResponds('ok').
        callbackReceives('ok');
    });

    describe('when given an object with ELEMENT', function() {
      var el;

      beforeEach(function() {
        el = { ELEMENT: 'foo' };
        subject.switchToFrame(el, commandCallback);
      });

      device.
        shouldSend({
          type: 'switchToFrame',
          element: 'foo'
        }).
        serverResponds('ok').
        callbackReceives('ok');
    });

  });

  describe('.importScript', function() {
    device.
      issues('importScript', 'foo').
      shouldSend({
        type: 'importScript',
        script: 'foo'
      }).
      serverResponds('ok').
      callbackReceives('ok');
  });

  describe('.setScriptTimeout', function() {
    it('should have a default timeout', function() {
      expect(subject.scriptTimeout).to.be.ok();
    });

    describe('after setting timeout', function() {
      device.
        issues('setScriptTimeout', 100).
        shouldSend({
          type: 'setScriptTimeout',
          value: 100
        }).
        serverResponds('ok').
        callbackReceives('ok');

      it('should update .scriptTimeout', function() {
        expect(subject.scriptTimeout).to.be(100);
      });
    });
  });

  describe('.goUrl', function() {
    device.
      issues('goUrl', 'http://wow').
      shouldSend({
        type: 'goUrl',
        value: 'http://wow'
      }).
      serverResponds('ok').
      callbackReceives('ok');
  });

  describe('.getUrl', function() {
    device.
      issues('getUrl').
      shouldSend({
        type: 'getUrl'
      }).
      serverResponds('getUrlResponse').
      callbackReceives('value');
  });

  describe('.goForward', function() {
    device.
      issues('goForward').
      shouldSend({
        type: 'goForward'
      }).
      serverResponds('ok').
      callbackReceives('ok');
  });

  describe('.goBack', function() {
    device.
      issues('goBack').
      shouldSend({
        type: 'goBack'
      }).
      serverResponds('ok').
      callbackReceives('ok');
  });

  describe('script executing commands', function() {
    var calledWith,
        args = [],
        script = 'return null;';

    beforeEach(function() {
      calledWith = null;
      subject._executeScript = function() {
        calledWith = arguments;
      };
    });

    describe('.executeScript', function() {
      beforeEach(function() {
        subject.executeScript(script, commandCallback);
      });

      it('should call _executeScript', function() {
        expect(calledWith).to.eql([
          { type: 'executeScript', value: script, args: null },
          commandCallback
        ]);
      });
    });

    describe('.executeJsScript', function() {
      beforeEach(function() {
        subject.executeJsScript(script, commandCallback);
      });

      it('should call _executeScript', function() {
        expect(calledWith).to.eql([
          { type: 'executeJSScript', value: script, timeout: true, args: null },
          commandCallback
        ]);
      });
    });

    describe('.executeAsyncScript', function() {
      beforeEach(function() {
        subject.executeAsyncScript(script, commandCallback);
      });

      it('should call _executeScript', function() {
        expect(calledWith).to.eql([
          { type: 'executeAsyncScript', value: script, args: null },
          commandCallback
        ]);
      });
    });
  });

  describe('.refresh', function() {
    device.
      issues('refresh').
      serverResponds('ok').
      shouldSend({ type: 'refresh' }).
      callbackReceives('ok');
  });

  describe('.log', function() {
    device.
      issues('log', 'wow', 'info').
      shouldSend({ type: 'log', value: 'wow', level: 'info' }).
      serverResponds('ok').
      callbackReceives('ok');
  });

  describe('.getLogs', function() {
    device.
      issues('getLogs').
      shouldSend({ type: 'getLogs' }).
      serverResponds('getLogsResponse').
      callbackReceives('value');
  });

  describe('._findElement', function() {

    function receivesElement() {
      var value;

      describe('callback argument', function() {
        beforeEach(function() {
          value = device.commandCallback.value;
          if (!(value instanceof Element) && !(value instanceof Array)) {
            throw new Error('result is not an array or an Element instance');
          }

          if (!(value instanceof Array)) {
            value = [value];
          }
        });

        it('should be an instance of Marionette.Element', function() {
          value.forEach(function(el) {
            expect(el).to.be.a(Element);
            expect(el.client).to.be(subject);
            expect(el.id).to.contain('{');
          });
        });
      });
    }

    describe('with overriden Element', function() {
      var MyElement;

      beforeEach(function() {
        MyElement = function() {
          Element.apply(this, arguments);
        };

        MyElement.prototype = { __proto__: Element.prototype };
        subject.Element = MyElement;
      });

      device.
        issues('_findElement', 'findElement', '#wow').
        shouldSend({
          type: 'findElement',
          value: '#wow',
          using: 'css selector'
        }).
        serverResponds('findElementResponse');

      it('should return an instance of MyElement', function() {
        var value = device.commandCallback.value;
        expect(value).to.be.a(MyElement);
      });
    });

    describe('simple find with defaults', function() {
      device.
        issues('_findElement', 'findElement', '#wow').
        shouldSend({
          type: 'findElement',
          value: '#wow',
          using: 'css selector'
        }).
        serverResponds('findElementResponse');

      receivesElement();
    });

    describe('find with all options', function() {
      device.
        issues('_findElement', 'findElements', 'wow', 'class name', 1).
        shouldSend({
          type: 'findElements',
          value: 'wow',
          using: 'class name',
          element: 1
        }).
        serverResponds('findElementResponse');

      receivesElement();
    });

    describe('trying to find with invalid \'using\'', function() {

      it('should fail', function() {
        expect(function() {
          subject._findElement(
            'findElement', 'wow', 'fake', function() {}
          );
        }).to.throwError(/invalid option for using/);
      });
    });

  });

  describe('element finders', function() {
    var calledWith;

    function delegatesToFind(type) {
      describe('.' + type, function() {
        beforeEach(function() {
          subject[type]('#query', commandCallback);
        });

        it('should call _findElement', function() {
          expect(calledWith).to.eql([
            type, '#query', commandCallback
          ]);
        });
      });
    }

    beforeEach(function() {
      subject._findElement = function() {
        calledWith = arguments;
      };
    });

    delegatesToFind('findElement');
    delegatesToFind('findElements');
  });

  describe('._executeScript', function() {
      var cmd = 'return window.location',
          args = [{1: true}],
          type = 'executeScript';

    describe('with args', function() {
      var request = {
        type: type,
        value: cmd,
        args: args
      };

      device.
        issues('_executeScript', request).
        shouldSend(request).
        serverResponds('getUrlResponse').
        callbackReceives('value');
    });

    describe('without args', function() {
      var request = {
        type: type,
        value: cmd
      };

      device.
        issues('_executeScript', request).
        shouldSend({
          type: type,
          value: cmd,
          args: []
        }).
        serverResponds('getUrlResponse').
        callbackReceives('value');
    });

    describe('with timeout', function() {
      var request = {
        type: 'executeJSScript',
        value: cmd,
        args: args,
        timeout: false
      };

      device.
        issues('_executeScript', request).
        shouldSend(request).
        serverResponds('getUrlResponse').
        callbackReceives('value');

    });

  });

  describe('._newSession', function() {
    var response;

    beforeEach(function(done) {
      response = exampleCmds.newSessionResponse();
      subject._newSession(function() {
        cbResponse = arguments;
        done();
      });

      driver.respond(response);
    });

    it('should send newSession', function() {
      expect(driver.sent[0].type).to.eql('newSession');
    });

    it('should save session id', function() {
      expect(subject.session).to.be(response.value);
    });

    it('should send callback response', function() {
      expect(cbResponse[1]).to.eql(response);
    });

  });

  describe('._convertFunction', function() {
    var result;
    var fn = function() { return true; };

    beforeEach(function() {
      result = subject._convertFunction(fn);
      result = result.replace(/\n|\s/g, '');
    });

    it('should format function to call immediately', function() {
      var expected;
      expected = 'return (function() { return true;}.apply(this, arguments));';
      expected = expected.replace(/\n|\s/g, '');
      expect(result).to.be(expected);
    });

    it('should not format strings', function() {
      expect(subject._convertFunction('foo')).to.be('foo');
    });

  });

  describe('._transformResultValue', function() {
    var result;
    describe('when it is an element', function() {
      beforeEach(function() {
        result = subject._transformResultValue({
          'ELEMENT': 'foo'
        });
      });

      it('should return an instance of element', function() {
        expect(result).to.be.a(Element);
        expect(result.id).to.be('foo');
      });

    });

    describe('when it is not an element', function() {
      var obj = {'foo': true};

      beforeEach(function() {
        result = subject._transformResultValue(obj);
      });

      it('should return same object', function() {
        expect(result).to.be(obj);
      });
    });
  });


  describe('._prepareArguments', function() {
    var args, result;

    beforeEach(function() {
      args = [
        new Element('{uuid}', subject),
        'wow',
        true
      ];

      result = subject._prepareArguments(args);
    });

    it('should process Marionette.Element instances into uuids', function() {
      expect(result).to.eql([
        {'ELEMENT': '{uuid}'},
        'wow',
        true
      ]);
    });

  });
});
