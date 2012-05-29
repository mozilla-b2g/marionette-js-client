/**
@namespace
*/
(function(module, ns) {

  var Responder;

  if (this.TestAgent) {
    Responder = TestAgent.Responder;
  } else {
    Responder = require('test-agent/lib/test-agent/responder');
  }

  FakeSocket = function() {
    Responder.call(this);
    FakeSocket.sockets.push(this);

    this.destroyed = false;

    if(arguments.length === 2) {
      this.host = arguments[0];
      this.port = arguments[1];
    }
  };

  FakeSocket.sockets = [];

  FakeSocket.prototype = Object.create(Responder.prototype);
  FakeSocket.prototype.connect = function(port, host) {
    this.port = port;
    this.host = host;
  };


  FakeSocket.prototype.destroy = function() {
    this.destroyed = true;
  };

  FakeSocket.prototype.close = FakeSocket.prototype.destroy;

  module.exports = exports = FakeSocket;

}.apply(
  this,
  (this.Marionette) ?
    [Marionette('support/socket'), Marionette] :
    [module, require('../../lib/marionette/marionette')]
));
