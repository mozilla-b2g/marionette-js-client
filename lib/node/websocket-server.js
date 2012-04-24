var Agent = require('test-agent'),
    ConnectionManger = require('./connection-manager'),
    debug = require('debug')('marionette:websocket-server');

function WebsocketServer(options){

  if(typeof(options) === 'undefined'){
    options = {};
  }

  this.manager = new ConnectionManger();

  Agent.WebsocketServer.apply(this, arguments);

  this.on('device create', this.onCreateDevice.bind(this));
  this.on('device command', this.onDeviceCommand.bind(this));
}

var proto = WebsocketServer.prototype = Object.create(Agent.WebsocketServer.prototype);

proto.listen = function(){
  Agent.WebsocketServer.prototype.listen.apply(this, arguments);
  this.use(Agent.server.Responder);
};


proto.onDeviceResponse = function(device, socket, data){
  debug('SOCKET FOR - ', device.id, 'RESPONDING WITH', data);
  socket.send(this.stringify('device response', {
    id: device.id,
    response: data
  }));
};

/**
 * Closes socket for connection
 *
 *
 * @param {Object} connection
 */
proto._destroyDeviceConnection = function(connection, id){
  connection.socket.destroy();
  debug("CLOSING SOCKET", id);
};

/**
 * Creates a device connection for client.
 *
 *
 */
proto.onCreateDevice = function(options, socket){
  if(!options){
    options = {};
  }

  var device = this.manager.open(options.port);
  socket.send(this.stringify('device ready', { id: device.id }));

  debug('CREATING DEVICE', device.id);

  socket.on('close', this._destroyDeviceConnection.bind(null, device.connection, device.id));
  device.connection.on('command', this.onDeviceResponse.bind(this, device, socket));
};

proto.onDeviceCommand = function(data, socket){
  if(typeof(data) === 'undefined'){
    data = {};
  }

  var device = this.manager.get(data.id);

  debug('SENDING DEVICE CMD', data.id, data.command);

  if(device){
    device.send(data.command);
  } else {
    socket.send(this.stringify('device response', {
      error: 'connection id ' + data.id + ' was not found'
    }));
  }
};



module.exports = exports = WebsocketServer;
