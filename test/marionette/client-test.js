var Client, cmds;

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

describe('marionette/client', function() {

  var subject, backend, cb, cbResponse,
      cmd, result, cmdResult;

  function commandCallback(data) {
    commandCallback.value = data;
  }

  function issues() {
    var args = Array.prototype.slice.call(arguments),
        cmd = args.shift();

    beforeEach(function() {
      args.push(commandCallback);
      result = subject[cmd].apply(subject, args);
    });

    it('should be chainable', function() {
      expect(result).to.be(subject);
    });
  }

  function serverResponds(type, options) {
    beforeEach(function() {
      if (!(type in cmds)) {
        throw new Error('there is no "' + type + '" example command');
      }
      cmdResult = cmds[type](options);
      backend.respond(cmdResult);
    });
  }


  function receivesValue() {
    it('should recevie value', function() {
      expect(commandCallback.value).to.be(cmdResult.value);
    });
  }

  function receivesOk() {
    it('should recevie ok', function() {
      expect(commandCallback.ok).to.be(cmdResult.ok);
    });
  }

  function sends(options) {
    var key;
    for (key in options) {
      if (options.hasOwnProperty(key)) {
        (function(option, value) {

          it('should send ' + option, function() {
            var sent = backend.sent[0];
            expect(sent[option]).to.eql(value);
          });
        }(key, options[key]));
      }
    }
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

    beforeEach(function(done) {
      response = cmds.getMarionetteIDResponse();
      subject._getActorId(function() {
        cbResponse = arguments;
        done();
      });

      backend.respond(response);
    });

    it('should send getMarionetteID', function() {
      expect(backend.sent[0].type).to.be('getMarionetteID');
    });

    it('should save actor id', function() {
      expect(subject.actor).to.be(response.id);
    });

    it('should send callback response', function() {
      expect(cbResponse[0]).to.eql(response);
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
    issues('setSearchTimeout', 50);
    serverResponds('ok');
    sends({
      type: 'setSearchTimeout',
      value: 50
    });
    receivesOk();
  });

  describe('.getWindow', function() {
    issues('getWindow');
    serverResponds('getWindowResponse');
    sends({
      type: 'getWindow'
    });
    receivesValue();
  });

  describe('.setContext', function() {
    issues('setContext', 'chrome');
    serverResponds('ok');
    sends({
      type: 'setContext',
      value: 'chrome'
    });
    receivesValue();
  });

  describe('.getWindows', function() {
    issues('getWindows');
    serverResponds('getWindowsResponse');
    sends({
      type: 'getWindows'
    });
    receivesValue();
  });

  describe('.switchToWindow', function() {
    issues('switchToWindow', '1-b2g');
    serverResponds('ok');
    sends({
      type: 'switchToWindow',
      value: '1-b2g'
    });
    receivesOk();
  });

  describe('.setScriptTimeout', function() {
    issues('setScriptTimeout', 100);
    serverResponds('ok');
    sends({
      type: 'setScriptTimeout',
      value: 100
    });
    receivesOk();
  });

  describe('.getUrl', function() {
    issues('getUrl');
    serverResponds('getUrlResponse');
    receivesValue();
    sends({
      type: 'getUrl'
    });
  });

  describe('.goForward', function() {
    issues('goForward');
    serverResponds('ok');
    receivesOk();
    sends({
      type: 'goForward'
    });
  });

  describe('.goBack', function() {
    issues('goBack');
    serverResponds('ok');
    receivesOk();
    sends({
      type: 'goBack'
    });
  });

  describe('.executeScript', function() {
    var cmd = 'return window.location',
        args = [{1: true}];

    describe('with args', function() {
      issues('executeScript', cmd, args);
      serverResponds('getUrlResponse');
      receivesValue();
      sends({
        type: 'executeScript',
        value: cmd,
        args: args
      });
    });

    describe('without args', function() {
      issues('executeScript', cmd);
      serverResponds('getUrlResponse');
      receivesValue();
      sends({
        type: 'executeScript',
        value: cmd,
        args: []
      });

    });
  });

  describe('.refresh', function() {
    issues('refresh');
    serverResponds('ok');
    receivesOk();
    sends({ type: 'refresh' });
  });

  describe('.log', function() {
    issues('log', 'wow', 'info');
    serverResponds('ok');
    receivesOk();
    sends({ type: 'log', value: 'wow', level: 'info' });
  });

  describe('.getLogs', function(){
    issues('getLogs');
    serverResponds('getLogsResponse');
    receivesValue();
    sends({ type: 'getLogs' });
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

});
