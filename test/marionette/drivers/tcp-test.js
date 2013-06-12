describe('marionette/drivers/tcp', function() {

  if (typeof(window) !== 'undefined') {
    return;
  }

  var Abstract,
      Driver = require('../../../lib/marionette/drivers/tcp'),
      FakeSocket = require('../../support/socket');

  cross.require(
    'marionette/drivers/abstract',
    'Marionette.Drivers.Abstract', function(obj) {
      Abstract = obj;
    }
  );

  var subject,
      RealSocket,
      sockets = [];

  before(function() {
    RealSocket = Driver.Socket;
    Driver.Socket = FakeSocket;
    FakeSocket.sockets = sockets;
  });

  after(function() {
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

    expect(subject.port).to.be(8888);
    expect(subject.host).to.be('foobar');
  });

  describe('._sendCommand', function() {
    var sent = [];

    beforeEach(function() {
      subject._connect();
      subject.client.send = function() {
        sent.push(arguments);
      }
      subject.client.send({
        type: 'foo',
      });
    });

    it('should send request to socket', function() {
      expect(sent).to.eql([
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
      expect(sent).to.eql([
        [{ id: 0, response: {type: 'foo'} }]
      ]);
    });

  });

  describe('._connect', function() {

    beforeEach(function() {
      subject._connect();
    });

    it('should create a socket for connection', function() {
      expect(sockets[0].host).to.be('localhost');
      expect(sockets[0].port).to.be(2828);
    });

  });

  describe('._close', function() {
    beforeEach(function() {
      subject._connect();
      subject.close();
    });

    it('should close socket', function() {
      expect(subject.socket.destroyed).to.be(true);
    });

  });


});

