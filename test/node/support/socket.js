var EventEmitter = require('events').EventEmitter;

FakeSocket = function(){
  EventEmitter.call(this);
  FakeSocket.sockets.push(this);
};

FakeSocket.sockets = [];

FakeSocket.prototype = Object.create(EventEmitter.prototype);
FakeSocket.prototype.connect = function(port){
  this.port = port;
};

module.exports = exports = FakeSocket;
