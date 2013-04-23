describe('node/http-proxy-test', function() {
  var FakeSocket = require('../support/socket');
  var ProxyServer = require('../../lib/node/http-proxy');
  var CommandStream = require('../../lib/marionette/command-stream');
  var XMLHttpRequest = require('../../lib/XMLHttpRequest.js').XMLHttpRequest;
  var XHR = require('../../lib/marionette/xhr');

  function createRequest(options) {
    var base = {
      url: 'http://localhost:60023',
      headers: { 'Content-Type': 'application/json' }
    };

    for (var key in options) {
      base[key] = options[key];
    }

    return new XHR(base);
  }

  function createPost() {
    var url = 'http://localhost:' + subject.port + '/';
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, /* sync request */ true);

    return xhr;
  }

  function post(json, callback) {
    var xhr = createPost();

    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(json));

    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        callback(JSON.parse(xhr.responseText));
      }
    };
  }

  var subject;

  beforeEach(function() {
    subject = new ProxyServer();
    subject._createSocket = function() {
      return new FakeSocket();
    };

    subject.listen();
  });

  afterEach(function() {
    subject.close();
  });

  it('should have .activeSockets', function() {
    expect(subject.activeSockets).to.be.ok();
  });

  it('should have .port', function() {
    expect(subject.port).to.be.ok();
  });

  describe('POST /', function() {

    it('should create socket / command stream given ID', function(done) {
      var xhr = createRequest({
        method: 'POST',
        data: {}
      });

      xhr.send(function(data, xhr) {
        // successful request
        expect(data.id).to.be.ok();

        var socketDetails = subject.activeSockets[data.id];

        // creates socket
        expect(socketDetails).to.be.ok();

        // has stream and socket
        expect(socketDetails.stream).to.be.a(CommandStream);
        expect(socketDetails.socket).to.be.ok();
        expect(socketDetails.id).to.be(data.id);

        done();
      });
    });

    it('should close socket if no activity after awhile', function(done) {
      var id;

      subject.inactivityTimeout = 10;
      createRequest({ method: 'POST' }).send(function(result) {
        id = result.id;
        var socket = FakeSocket.sockets[FakeSocket.sockets.length - 1];

        socket.destroy = function() {
          expect(subject.activeSockets[id]).not.to.be.ok();
          done();
        };
      });

    });
  });

  describe('DELETE /', function() {
    var id;

    beforeEach(function(done) {
      createRequest({ method: 'POST' }).send(function(result) {
        id = result.id;
        expect(id).to.be.ok();
        done();
      });
    });

    it('should remove and close socket', function(done) {
      var socketClosed = false;
      // get the fake socket
      var socket = FakeSocket.sockets[FakeSocket.sockets.length - 1];
      socket.destroy = function() {
        socketClosed = true;
      };

      createRequest({ method: 'DELETE', data: { id: id } }).send(function() {
        expect(socketClosed).to.be.ok();
        expect(subject.activeSockets[id]).not.to.be.ok();
        done();
      });

    });
  });

  describe('PUT /{command}', function() {
    var id;
    var stream;
    var command = {
      type: 'goUrl',
      value: 'xx'
    };

    beforeEach(function(done) {
      subject.inactivityTimeout = 10;
      createRequest({ method: 'POST' }).send(function(json) {
        expect(json.id).to.be.ok();
        id = json.id;
        stream = subject.activeSockets[id].stream;
        done();
      });
    });

    it('should write command to command stream', function(done) {
      var sent = { foo: 'bar' };
      var wrapper = { id: id, payload: command };

      var isComplete = false;
      stream.send = function(data) {
        var json = JSON.stringify(sent);
        expect(data).to.eql(command);
        stream.add(json.length + ':' + json);
      };

      createRequest({ method: 'PUT', data: wrapper }).send(function(result) {
        expect(result).to.eql(sent);
        done();
      });
    });
  });

});
