describe('marionette/drivers/abstract', function() {
  var subject,
      Backend,
      sent = [];

  helper.require('drivers/abstract', function(obj) {
    Backend = obj;
  });

  beforeEach(function() {
    subject = new Backend();

    sent = [];

    subject._sendCommand = function() {
      sent.push(arguments);
    };
  });

  describe('initialization', function() {

    it('should setup ._sendQueue', function() {
      assert.deepEqual(subject._sendQueue, []);
    });

    it('should not be ready', function() {
      assert.strictEqual(subject.ready, false);
    });

    it('should setup ._responseQueue', function() {
      assert.instanceOf(subject._responseQueue, Array);
    });

    it('should have timeout set to 10000', function() {
      assert.strictEqual(subject.timeout, 10000);
    });

    it('should be _waiting', function() {
      assert.strictEqual(subject._waiting, true);
    });
  });

  describe('event: device response', function() {

    var callback,
        callbackResponse,
        response;

    beforeEach(function() {
      callbackResponse = null;
      response = {
        id: 10,
        response: {
          from: 'marionette',
          value: 'hit'
        }
      };

      //emulate connect
      subject.connectionId = 10;
      subject.ready = true;
      subject._waiting = false;

      callback = function() {
        callbackResponse = arguments;
      };

      subject.send(exampleCmds.newSession(), callback);
      assert.strictEqual(subject._waiting, true);
    });

    describe('when response is for different device', function() {
      beforeEach(function() {
        subject.connectionId = 101;
        subject._onDeviceResponse(response);
      });

      it('should trigger response callbacks', function() {
        assert.strictEqual(callbackResponse, null);
      });
    });

    describe('when response is for device id', function() {
      var calledNext;

      beforeEach(function() {
        calledNext = false;
        subject._nextCommand = function() {
          calledNext = true;
          Backend.prototype._nextCommand.apply(this, arguments);
        };
        subject._onDeviceResponse(response);
      });

      it('should trigger response callbacks', function() {
        assert.deepEqual(callbackResponse[0], response.response);
      });

      it('should clear response queue', function() {
        assert.strictEqual(subject._responseQueue.length, 0);
      });

      it('should not be waiting', function() {
        assert.strictEqual(subject._waiting, false);
      });

    });
  });

  describe('.close', function() {

    var calledClose;

    beforeEach(function() {
      calledClose = false;
      subject.ready = true;
      subject._responseQueue = [function() {}];
      subject._close = function() {
        calledClose = true;
      };
      subject.close();
    });

    it('should call _close', function() {
      assert.strictEqual(calledClose, true);
    });

    it('should not be ready', function() {
      assert.strictEqual(subject.ready, false);
    });

    it('should clean up _responseQueue', function() {
      assert.strictEqual(subject._responseQueue.length, 0);
    });

  });

  describe('.connect', function() {
    var cmd, calledChild;

    beforeEach(function(done) {
      cmd = exampleCmds.connect();
      calledChild = false;

      subject._connect = function() {
        subject.connectionId = 10;
        calledChild = true;
        //this will cause connect to callback to fire
        subject._onDeviceResponse({
          id: 10,
          response: cmd
        });
      };

      assert.strictEqual(subject._waiting, true);

      subject.connect(function() {
        done();
      });
    });

    it('should set .traits', function() {
      assert.deepEqual(subject.traits, []);
    });

    it('should set .applicationType', function() {
      assert.strictEqual(subject.applicationType, cmd.applicationType);
    });

    it('should call _connect', function() {
      assert.strictEqual(calledChild, true);
    });

    it('should not be waiting', function() {
      assert.strictEqual(subject._waiting, false);
    });

    it('should be ready', function() {
      assert.strictEqual(subject.ready, true);
    });

  });

  describe('._nextCommand', function() {
    var cmd1, cmd2;

    beforeEach(function() {
      cmd1 = exampleCmds.newSession();
      cmd2 = exampleCmds.newSession({isOther: true});
      subject._sendQueue[0] = cmd1;
      subject._sendQueue[1] = cmd2;
    });

    describe('when waiting', function() {
      beforeEach(function() {
        subject._waiting = true;
        subject._nextCommand();
      });

      it('should not send command to server', function() {
        assert.strictEqual(sent.length, 0);
      });
    });

    describe('when not waiting', function() {
      beforeEach(function() {
        subject._waiting = false;
        subject._nextCommand();
      });

      it('should be waiting', function() {
        assert.strictEqual(subject._waiting, true);
      });

      it('should send command to server', function() {
        assert.deepEqual(sent[0][0], cmd1);
      });

    });

    describe('when there are no comamnds and we are not waiting', function() {
      beforeEach(function() {
        //emulate connect
        subject._waiting = false;

        subject._responseQueue = [];
        subject._sendQueue = [];
        subject._nextCommand();
      });

      it('should not be waiting', function() {
        assert.strictEqual(subject._waiting, false);
      });
    });

  });

  describe('.send', function() {
    var cmd, cb = function() {};

    beforeEach(function() {
      cmd = exampleCmds.newSession();
    });

    describe('when device is not ready', function() {

      it('should throw an error', function() {
        assert.throws(function() {
          subject.send({ type: 'newSession' });
        }, /not ready/);
      });
    });

    describe('when not waiting for a response', function() {
      beforeEach(function() {
        //emulate connect
        subject.ready = true;
        subject._waiting = false;

        subject.send(cmd, cb);
      });

      it('should send command', function() {
        assert.strictEqual(sent.length, 1);
      });

      it('should be waiting', function() {
        assert.strictEqual(subject._waiting, true);
      });
    });

    describe('when waiting for a response', function() {

      var nextCalled;

      beforeEach(function() {
        subject.ready = true;
        subject._waiting = true;

        nextCalled = false;
        subject._nextCommand = function() {
          nextCalled = true;
        };

        subject.send(cmd, cb);
      });

      it('should call next', function() {
        assert.strictEqual(nextCalled, true);
      });

      it('should add send command to queue', function() {
        assert.strictEqual(subject._sendQueue[0], cmd);
      });

      it('should add calback to response queue', function() {
        assert.strictEqual(subject._responseQueue[0], cb);
      });
    });

  });


});

