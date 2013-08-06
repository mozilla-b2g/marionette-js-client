(function() {

  global.expect = require('expect.js');

  //always load test-agent for now

  global.helper = {
    requireLib: function(path, cb) {
      return require('../lib/' + path);
    },

    nsFind: function(obj, string) {
      var result = obj,
          part,
          parts = string.split('.');

      while ((part = parts.shift())) {
        if (result[part]) {
          result = result[part];
        } else {
          throw new Error('Cannot find ' + string + ' in object ');
        }
      }
      return result;
    },

    require: function(path, component, cb) {

      if (typeof(component) === 'function') {
        //new module pattern
        cb = component;
        component = path;

        if (/^support/.test(path)) {
          path = '/test/' + path;
        } else {
          path = '/lib/marionette/' + path;
        }
      } else {
        //old system
        path = '/lib/' + path;
      }

      cb(require('..' + path));
    }
  };

  helper.require('responder', function(obj) {});

  helper.require('example-commands', function(obj) {
    global.exampleCmds = obj;
  });

  helper.require('support/device-interaction', function(obj) {
    global.DeviceInteraction = obj;
  });

  helper.require('support/socket', function(obj) {
    global.FakeSocket = obj;
  });

  helper.require('support/mock-driver', function(obj) {
    global.MockDriver = obj;
  });

}.call(this));
