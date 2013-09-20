describe('marionette/drivers/tcp', function() {

  if (typeof(window) !== 'undefined') {
    return;
  }

  var Abstract,
      Driver = require('../../../lib/marionette/drivers/tcp'),
      FakeSocket = require('../../support/socket');

  helper.require(
    'marionette/drivers/abstract',
    'Marionette.Drivers.Abstract', function(obj) {
      Abstract = obj;
    }
  );

  function issueFirstResponse() {
    subject._onDeviceResponse({
      id: subject.connectionId,
      response: {}
    });
  }

  var subject,
      RealSocket,
      sockets = [];

  var socketRetry = require('socket-retry-connect');
  var realWaitForSocket;

  beforeEach(function() {
    realWaitForSocket = socketRetry.waitForSocket;

    RealSocket = Driver.Socket;
    Driver.Socket = FakeSocket;
    FakeSocket.sockets = sockets;

    socketRetry.waitForSocket = function(options, callback) {
      var socket = new FakeSocket(options.port);
      callback(null, socket);
    };
  });

  afterEach(function() {
    socketRetry.waitForSocket = realWaitForSocket;
    Driver.Socket = RealSocket;
  });

  function connect() {
    beforeEach(function() {
      subject.connect(function() {
        done();
      });
    });
  }

  beforeEach(function() {
    subject = new Driver();
  });

  it('should accept port and host', function() {
    var subject = new Driver({
      port: 8888,
      host: 'foobar'
    });

    assert.strictEqual(subject.port, 8888);
    assert.strictEqual(subject.host, 'foobar');
  });

  describe('._sendCommand', function() {
    var sent = [];

    beforeEach(function(done) {
      subject.connect(function() {
        subject.client.send = function() {
          sent.push(arguments);
        }
        subject.client.send({
          type: 'foo',
        });
        done();
      });

      // issue first response so connect will fire
      issueFirstResponse();
    });

    it('should send request to socket', function() {
      assert.deepEqual(sent, [
        [{type: 'foo'}]
      ]);
    });

  });

  describe('client event: command', function() {
    var sent = [];

    beforeEach(function() {
      sent.length = 0;
      subject._onDeviceResponse = function() {
        sent.push(arguments);
      }
      subject._connect();
      subject.client.emit('command', { type: 'foo' });
    });

    it('should call onDeviceResponse', function() {
      assert.deepEqual(sent, [
        [{ id: 0, response: {type: 'foo'} }]
      ]);
    });

  });

  describe('._connect', function() {
    describe('retrying', function() {
      var net = require('net');
      var port = 60066;

      beforeEach(function() {
        Driver.Socket = RealSocket;
        socketRetry.waitForSocket = realWaitForSocket;
        subject = new Driver({ port: port });
      });

      it('should eventually connect', function(done) {
        subject._connect();
        setTimeout(function() {
          var server = net.createServer(function(socket) {
            server.close();
            done();
          }).listen(port);
        }, 50);
      });

    });

  });

  describe('._close', function() {
    beforeEach(function(done) {
      subject.connect(function() {
        subject.close();
        done();
      });
      issueFirstResponse();
    });

    it('should close socket', function() {
      assert.strictEqual(subject.socket.destroyed, true);
    });

  });


});

