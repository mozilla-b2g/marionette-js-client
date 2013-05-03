describe('drivers/http-proxy', function() {
  if (!cross.isNode)
    return test('only works on node');

  var FakeSocket = require('../../support/socket');
  var ProxyServer = require('../../../lib/node/http-proxy');
  var Client = require('../../../lib/marionette/client');
  var Driver = require('../../../lib/marionette/drivers/http-proxy');

  var server;
  var socket;
  var driver;
  var client;
  var sentData;

  afterEach(function() {
    server.close();
  });

  beforeEach(function() {
    sentData = [];

    socket = new FakeSocket(2828, 'localhost');
    server = new ProxyServer(socket);
    server.listen();

    var realSend = server.stream.send;
    server.stream.send = function(data) {
      sentData.push(data);
      realSend.apply(this, arguments);
    };

    var driver = new Driver();
    client = new Client(driver, {
      sync: true
    });
  });

  describe('starting session', function() {
    beforeEach(function() {
      client.startSession();
    });

    it('should send request', function() {
      
    });

  });
});

