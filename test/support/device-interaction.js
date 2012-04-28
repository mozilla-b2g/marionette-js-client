(function(exports) {

  function DeviceInteraction(cmds, subject) {
    var cmdResult, type;

    subject = subject;
    commands = cmds;

    beforeEach(function() {
      cmdResult = null;
    });

    return {

      commandCallback: function commandCallback(data) {
        commandCallback.value = data;
      },

      issues: function issues() {
        var args = Array.prototype.slice.call(arguments),
            cmd = args.shift(),
            result,
            commandCallback = this.commandCallback;

        beforeEach(function() {
          args.push(commandCallback);
          if (!(cmd in subject())) {
            throw new Error('client does not have method ' + cmd);
          }
          result = subject()[cmd].apply(subject(), args);
        });

        it('should be chainable', function() {
          expect(result).to.be(subject());
        });

        return this;
      },

      shouldSend: function shouldSend(options) {
        var key;
        for (key in options) {
          if (options.hasOwnProperty(key)) {
            (function(option, value) {

              it('should send ' + option, function() {
                var sent = subject().backend.sent[0];
                expect(sent[option]).to.eql(value);
              });
            }(key, options[key]));
          }
        }
        return this;
      },

      serverResponds: function serverResponds(type, options) {
        beforeEach(function() {
          if (!(type in cmds)) {
            throw new Error('there is no \'' + type + '\' example command');
          }
          cmdResult = commands[type](options);
          subject().backend.respond(cmdResult);
        });
        return this;
      },

      callbackReceives: function callbackReceives(key) {
        var commandCallback = this.commandCallback;
        it('should receive the ' + key + ' from response', function() {
          expect(commandCallback.value).to.be(cmdResult[key]);
        });
        return this;
      }
    };
  }

  exports.DeviceInteraction = DeviceInteraction;

}(
  (typeof(window) === 'undefined') ? module.exports : window
));
