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

    requireLib: function(path, cb) {
      if (this.isNode) {
        return require('../lib/' + path);
      } else {
        return require('/lib/' + path + '.js', cb);
      }
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
      if (typeof(component) === 'function') {
        //new module pattern
        cb = component;
        component = path;
        path += '.js';

        if (/^support/.test(path)) {
          path = '/test/' + path;
        } else {
          path = '/lib/marionette/' + path;
        }


        if (isNode) {
          cb(require('..' + path));
        } else {
          context.require(path, function() {
            cb(Marionette.require(component));
          });
        }
      } else {
        if (!path.match(/.js$/)) {
          path += '.js';
        }

        //old system
        path = '/lib/' + path;

        if (isNode) {
          cb(require('..' + path));
        } else {
          context.require(path, function() {
            cb(this.nsFind(context, component));
          }.bind(this));
        }
      }

    }
  };

  //Universal utils for tests.
  //will be loaded for all tests and available
  //in static scope inside and outside of tests.
  if (!isNode) {
    require('/lib/marionette/marionette.js');
  }

  cross.require('example-commands', function(obj) {
    context.exampleCmds = obj;
  });

  cross.require('support/device-interaction', function(obj) {
    context.DeviceInteraction = obj;
  });

  cross.require('support/fake-xhr', function(obj) {
    context.FakeXhr = obj;
  });

  cross.require('support/mock-driver', function(obj) {
    context.MockDriver = obj;
  });

}.call(this));
