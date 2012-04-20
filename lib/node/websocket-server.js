var Agent = require('test-agent'),
    ConnectionManger = require('./connection-manager');

function WebsocketServer(options){

  if(typeof(options) === 'undefined'){
    options = {};
  }

  this.manager = new ConnectionManger();

  Agent.WebsocketServer.apply(this, arguments);

  this.on('create device', this.onCreateDevice.bind(this));
  this.on('device command', this.onDeviceCommand.bind(this));
}

var proto = WebsocketServer.prototype = Object.create(Agent.WebsocketServer.prototype);

proto.listen = function(){
  Agent.WebsocketServer.prototype.listen.apply(this, arguments);
  this.use(Agent.server.Responder);
};


proto.onDeviceResponse = function(device, socket, data){
  socket.send(this.stringify('device response', {
    id: device.id,
    response: data
  }));
};

/**
 * Creates a device connection for client.
 *
 *
 */
proto.onCreateDevice = function(options, socket){
  if(typeof(options) === 'undefined'){
    options = {};
  }

  var device = this.manager.open(options.port);
  socket.send(this.stringify('device ready', { id: device.id }));

  device.connection.on('command', this.onDeviceResponse.bind(this, device, socket));
};

proto.onDeviceCommand = function(data, socket){
  if(typeof(data) === 'undefined'){
    data = {};
  }

  var device = this.manager.get(data.id);

  if(device){
    device.send(data.command);
  } else {
    socket.send(this.stringify('device response', {
      error: 'connection id ' + data.id + ' was not found'
    }));
  }
};



module.exports = exports = WebsocketServer;
