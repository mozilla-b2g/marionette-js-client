describe('marionette/command-stream', function() {

  var subject, socket,
      Responder,
      CommandStream;

  cross.require(
    'test-agent/responder',
    'TestAgent.Responder', function(obj) {
      Responder = obj;
    }
  );

  cross.require('command-stream', function(obj) {
    CommandStream = obj;
  });

  beforeEach(function() {
    socket = new Responder();
    subject = new CommandStream(socket);
  });

  describe('initialization', function() {
    it('should not be in a command', function() {
      expect(subject.inCommand).to.be(false);
    });

    it('should have an empty buffer', function() {
      expect(subject.buffer).to.be('');
    });

    it('should save socket', function() {
      expect(subject.socket).to.be(socket);
    });

    it('should be an event emitter', function() {
      expect(subject.on).to.be.a(Function);
    });

    it('should have no commandLength', function() {
      expect(subject.commandLength).to.be(0);
    });
  });

  describe('socket event: data', function() {

    var calledWith, data;

    beforeEach(function() {
      data = {};

      subject.on('command', function() {
        calledWith = Array.prototype.slice.call(arguments);
      });

      subject.socket.emit('data', subject.stringify(data));
    });

    it('should call add', function() {
      expect(calledWith).to.eql([data]);
    });

  });

  describe('.stringify', function() {
    var command = {works: true},
        result;

    function shouldStringify() {
      it('should return json string with length + : prefix (n:jsonstring)', function() {
        var string = JSON.stringify(command);
        expect(result).to.be(String(string.length) + subject.prefix + string);
      });
    }

    describe('when given an object', function() {
      beforeEach(function() {
        result = subject.stringify(command);
      });

      shouldStringify();
    });

    describe('when given a string', function() {
      beforeEach(function() {
        result = subject.stringify(JSON.stringify(command));
      });

      shouldStringify();
    });
  });

  describe('._handleCommand', function() {

    var emitted, data = {uniq: true};

    beforeEach(function() {
      subject.on(subject.commandEvent, function() {
        emitted = arguments[0];
      });
      subject._handleCommand(JSON.stringify(data));
    });

    it('should parse and emit command', function() {
      expect(emitted).to.eql(data);
    });
  });

  describe('.send', function() {

    var calledWith = [], data = {uniq: true};

    function sendsToSocket(fnName) {
      beforeEach(function() {
        subject.socket[fnName] = function() {
          calledWith = Array.prototype.slice.call(arguments);
        };
        subject.send(data);
      });

      it('should write to socket', function() {
        expect(calledWith[0]).to.be(subject.stringify(data));
      });
    }


    describe('when using socket.send', function() {
      sendsToSocket('send');
    });

    describe('when using socket.write', function() {
      sendsToSocket('write');

      it('should write in utf8', function() {
        expect(calledWith[1]).to.be('utf8');
      });
    });

  });

  describe('.add', function() {

    var commands = [],
        chunks = {},
        commandList = {
          success: {'from': 'someX'},
          fail: {'from': 'zya'}
        };


    function add(string, log) {
      var buffer = string;
      subject.add(buffer);
    }

    function emitsCommand(name, index) {

      index = index || 0;
      name = name || 'success';

      it('should emit ' + name + ' command at the #' + index + ' index', function() {
        expect(commands[index]).to.eql(commandList[name]);
      });
    }

    function hasCommands(number) {
      it('should have ' + String(number) + ' of commands', function() {
        expect(commands.length).to.be(number);
      });
    }

    beforeEach(function() {
      commands = [];
      Object.keys(commandList).forEach(function(key) {
        chunks[key] = subject.stringify(commandList[key]);
      });

      subject.on(subject.commandEvent, function(response) {
        commands.push(response);
      });
    });

    describe('when given the entire command', function() {
      beforeEach(function() {
        add(chunks.success);
      });

      emitsCommand('success', 0);
      hasCommands(1);
    });

    describe('when given single command in multiple chunks', function() {

      beforeEach(function() {
        add(chunks.success.slice(0, 1));
        add(chunks.success.slice(1, 2));
        add(chunks.success.slice(2));
      });

      emitsCommand('success', 0);
      hasCommands(1);

    });

    describe('when given multiple commands in two chunks', function() {
      beforeEach(function() {
        var chunk = chunks.success + chunks.fail,
            piece1,
            piece2,
            half = Math.floor(chunk.length / 2);

        piece1 = chunk.slice(0, half);
        piece2 = chunk.slice(half);
        //sanity check
        expect(piece1 + piece2).to.be(chunk);

        add(piece1);
        add(piece2);
      });

      emitsCommand('success', 0);
      emitsCommand('fail', 1);
      hasCommands(2);

    });

    describe('when given both commands in one chunk', function() {
      beforeEach(function() {
        add(chunks.fail + chunks.success);
      });

      emitsCommand('fail', 0);
      emitsCommand('success', 1);
      hasCommands(2);

    });

  });

});

