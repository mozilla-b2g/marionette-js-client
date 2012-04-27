var Client, cmds, MockBackend, DeviceInteraction;

cross.require(
  'marionette/client',
  'Marionette.Client', function(obj) {
    Client = obj;
  }
);

cross.require(
  'marionette/example-commands',
  'Marionette.ExampleCommands',
  function(obj) {
    cmds = obj;
  }
);


cross.require(
  '../test/support/mock-backend',
  'MockBackend',
  function(obj) {
    MockBackend = obj;
  }
);

cross.require(
  '../test/support/device-interaction',
  'DeviceInteraction',
  function(obj) {
    DeviceInteraction = obj;
    test();
  }
);

//this is hack to ensure device interactions are
//loaded
function test() {

describe('marionette/client', function() {

  var subject, backend, cb, cbResponse,
      cmd, result, device;

  device = new DeviceInteraction(cmds, function() {
    return subject;
  });

  function commandCallback(data) {
    commandCallback.value = data;
  }

  beforeEach(function() {
    commandCallback.value = null;
    backend = new MockBackend();
    subject = new Client(backend);
    cb = function() {
      cbResponse = arguments;
    };
  });

  describe('initialization', function() {
    it('should save .backend', function() {
      expect(subject.backend).to.be(backend);
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
        expect(backend.sent[0]).to.eql({
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
          expect(backend.sent[0]).to.eql({
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
          expect(backend.sent[0]).to.eql({
            to: 'root',
            type: '_getActorId'
          });
        });

      });

    });
  });

  describe('.startSession', function() {
    beforeEach(function(done) {

      subject.startSession(function() {
        done();
      });

      backend.respond(cmds.getMarionetteIDResponse());
      backend.respond(cmds.newSessionResponse());
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
        cmds.getMarionetteIDResponse().id
      );
    });

  });

  describe('._sendCommand', function() {
    var cmd, response;
    it('should send given command and format the result', function(done) {
      var result;
      cmd = cmds.getUrl();
      response = cmds.getUrlResponse();

      result = subject._sendCommand(cmd, 'value', function(data) {
        expect(data).to.be(response.value);
        done();
      });

      backend.respond(response);
      expect(result).to.be(subject);
    });
  });

  describe('.setSearchTimeout', function() {
    device.
      issues('setSearchTimeout', 50).
      shouldSend({
        type: 'setSearchTimeout',
        value: 50
      }).
      serverResponds('ok').
      callbackReceives('ok');
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
    device.
      issues('setContext', 'chrome').
      shouldSend({
        type: 'setContext',
        value: 'chrome'
      }).
      serverResponds('ok').
      callbackReceives('value');
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

  describe('.setScriptTimeout', function() {
    device.
      issues('setScriptTimeout', 100).
      shouldSend({
        type: 'setScriptTimeout',
        value: 100
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
      response = cmds.newSessionResponse();
      subject._newSession(function() {
        cbResponse = arguments;
        done();
      });

      backend.respond(response);
    });

    it('should send newSession', function() {
      expect(backend.sent[0].type).to.eql('newSession');
    });

    it('should save session id', function() {
      expect(subject.session).to.be(response.value);
    });

    it('should send callback response', function() {
      expect(cbResponse[0]).to.eql(response);
    });

  });

});

}
