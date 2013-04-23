describe('node/http-proxy-test', function() {
  var FakeSocket = require('../support/socket');
  var ProxyServer = require('../../lib/node/http-proxy');
  var CommandStream = require('../../lib/marionette/command-stream');
  var XMLHttpRequest = require('../../lib/XMLHttpRequest.js').XMLHttpRequest;

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
  var socket;

  beforeEach(function() {
    socket = new FakeSocket(2828, 'localhost');
    subject = new ProxyServer(socket);
  });

  it('should have .socket', function() {
    expect(subject.socket).to.be(socket);
  });

  it('should have .port', function() {
    expect(subject.port).to.be.ok();
  });

  it('should have .stream', function() {
    expect(subject.stream).to.be.an(CommandStream);
    expect(subject.stream.socket).to.be(socket);
  });


  describe('POST /{command}', function() {
    var command = {
      type: 'goUrl',
      value: 'xx'
    };

    beforeEach(function() {
      subject.listen();
    });

    afterEach(function() {
      subject.close();
    });

    function sendsStatusInvalid(done) {
      subject.stream.send = function() {
        done(new Error('should not send when 500'));
      };

      var xhr = createPost();
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          expect(xhr.status).to.be(500);
          done();
        }
      };

      return xhr;
    }

    it('should send 500 for non json types', function(done) {
      var xhr = sendsStatusInvalid(done);
      xhr.send('xfoo');
    });

    it('should write command to command stream', function(done) {
      var sent = { foo: 'bar' };
      subject.stream.send = function(data) {
        expect(data).to.eql(command);
        var json = JSON.stringify(sent);
        subject.stream.add(json.length + ':' + json);
      };

      post(command, function(result) {
        expect(result).to.eql(sent);
        done();
      });
    });

  });

});
