var CommandStream = require('./command-stream');

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
  open: function(port){
    var socket,
        stream,
        id = this.currentId++,
        closeFn = this.close.bind(this, id);

    port = port || this.defaultPort;

    socket = new ConnectionManger.Socket();
    socket.on('close', closeFn);
    socket.on('end', closeFn);

    stream = new CommandStream(socket);

    socket.connect(port);
    this.connections[id] = stream;

    return { id: id, connection: stream };
  },

  /**
   * Returns connection by id
   *
   * @param {Number} id
   */
  get: function(id){
    return this.connections[id];
  },

  /**
   * Closes and removes a connection.
   *
   * @param {Number} id
   */
  close: function(id){
    delete this.connections[id];
  }

};

module.exports = exports = ConnectionManger;
