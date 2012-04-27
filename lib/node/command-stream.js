var EventEmitter = require('events').EventEmitter,
    debug = require('debug')('marionette:command-stream');

/**
 * Command stream accepts a socket or any event
 * emitter that will emit data events
 *
 *
 * @param {EventEmitter}
 */
function CommandStream(socket) {
  this.buffer = '';
  this.inCommand = false;
  this.commandLength = 0;
  this.socket = socket;

  EventEmitter.apply(this);

  socket.on('data', this.add.bind(this));
}

var proto = CommandStream.prototype = Object.create(EventEmitter.prototype);

/**
 * Length prefix
 *
 * @property prefix
 * @type String
 */
proto.prefix = ':';
proto.commandEvent = 'command';

proto.stringify = function stringify(command) {
  var string;
  if (typeof(command) === 'string') {
    string = command;
  } else {
    string = JSON.stringify(command);
  }

  return String(string.length) + this.prefix + string;
};

/**
 * Accepts raw string command parses it and
 * emits a commandEvent.
 *
 * @param {String}
 * @private
 */
proto._handleCommand = function _handleCommand(string) {
  var data = JSON.parse(string);
  debug('sending event', data);
  this.emit(this.commandEvent, data);
};

proto._checkBuffer = function _checkBuffer() {
  var lengthIndex;
  if (!this.inCommand) {
    lengthIndex = this.buffer.indexOf(this.prefix);
    if (lengthIndex !== -1) {
      this.commandLength = parseInt(this.buffer.slice(0, lengthIndex));
      this.buffer = this.buffer.slice(lengthIndex + 1);
      this.inCommand = true;
    }
  }

  return this.inCommand;
};

proto._readBuffer = function _readBuffer() {
  var commandString;

  if (this._checkBuffer()) {
    if (this.buffer.length >= this.commandLength) {
      commandString = this.buffer.slice(0, this.commandLength);
      this._handleCommand(commandString);
      this.buffer = this.buffer.slice(this.commandLength);
      this.inCommand = false;

      this._readBuffer();
    }
  }
  return this;
};

/**
 * Writes a command to the socket.
 * Handles conversion and formatting of object.
 *
 *
 * @param {Object} data
 */
proto.send = function send(data) {
  debug('writing ', data, 'to socket');
  this.socket.write(this.stringify(data), 'utf8');
};

proto.add = function add(buffer) {
  var lengthIndex, command;

  this.buffer += buffer.toString();
  this._readBuffer();
};

module.exports = exports = CommandStream;
