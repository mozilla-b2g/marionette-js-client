var CommandStream = require('./command-stream'),
    debug = require('debug')('marionette:connection-manager');

ConnectionManger.Socket = require('net').Socket;

function ConnectionManger(){
  this.connections = {};
}

ConnectionManger.prototype = {

  currentId: 0,

  defaultPort: 2828,

  /**
   * Opens a connection and returns the id and connection
   *
   *    manager.open()
   *    // => {id: 0, connection: new CommandStream() }
   *
   *
   */
  open: function open(port){
    var socket,
        stream,
        id = this.currentId++,
        closeFn = this.close.bind(this, id);

    port = port || this.defaultPort;

    socket = new ConnectionManger.Socket();
    socket.on('close', closeFn);
    socket.on('end', closeFn);

    stream = new CommandStream(socket);

    socket.on('error', function(){
      debug(arguments);
    });

    socket.on('end', function(){
      debug('socket close');
    });

    socket.connect(port);
    this.connections[id] = stream;

    return { id: id, connection: stream };
  },

  /**
   * Returns connection by id
   *
   * @param {Number} id
   */
  get: function get(id){
    return this.connections[id];
  },

  /**
   * Closes and removes a connection.
   *
   * @param {Number} id
   */
  close: function close(id){
    delete this.connections[id];
  }

};

module.exports = exports = ConnectionManger;
