(function() {

  var isNode = typeof(window) === 'undefined';

  if (isNode) {
    expect = require('expect.js');
    context = global;
  } else {
    context = window;
    context.require('../vendor/expect.js');
  }

  //always load test-agent for now

  cross = {
    isNode: isNode,

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

    requireTestAgent: function(path, component, cb) {
      var container = {},
          prefix = 'test-agent/lib/';

      if (cross.isNode) {
        cb(require(prefix + path));
      } else {
        context.require('../vendor/test-agent.js', function() {
          cb(this.nsFind(context, component));
        }.bind(this));
      }

    },

    require: function(path, component, cb) {

      if(/^test-agent/.test(path)) {
        return cross.requireTestAgent.apply(this, arguments);
      }

      if (!path.match(/.js$/)) {
        path += '.js';
      }

      if (typeof(component) === 'function') {
        //new module pattern
        cb = component;
        path = '/lib/marionette/' + path;

        if (isNode) {
          cb(require('..' + path));
        } else {
          exports.require(path, function() {
            cb(TestAgent.require(path));
          });
        }
      } else {
        //old system
        path = '/lib/' + path;

        if (isNode) {
          cb(require('..' + path));
        } else {
          exports.require(path, function() {
            cb(this.nsFind(exports, component));
          }.bind(this));
        }
      }

    }
  };

  //Universal utils for tests.
  //will be loaded for all tests and available
  //in static scope inside and outside of tests.
  cross.require('example-commands', function(obj) {
    context.exampleCmds = obj;
  });

  cross.require(
    '../test/support/device-interaction',
    'DeviceInteraction',
    function(obj) {
      context.DeviceInteraction = obj.DeviceInteraction;
    }
  );

  cross.require(
    '../test/support/fake-xhr',
    'FakeXhr',
    function(obj) {
      context.FakeXhr = obj.FakeXhr;
    }
  );

  cross.require(
    '../test/support/mock-driver',
    'MockDriver',
    function(obj) {
      context.MockDriver = obj.MockDriver;
    }
  );

}.call(this));
