(function() {

  if (typeof(window) !== 'undefined') {
    window.navigator;
    window.Components;
  }

  var isNode = typeof(window) === 'undefined';
  var isXpc = !isNode && (typeof(window.xpcModule) !== 'undefined');

  if (isNode) {
    expect = require('expect.js');
    context = global;
    global.integration = require('./integration');
  } else {
    context = window;
    context.require('../vendor/expect.js');
  }

  //always load test-agent for now

  cross = {
    isNode: isNode,
    isXpc: isXpc,
    isBrowser: !isNode && !isXpc,

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

    require: function(path, component, cb) {

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
    require('/node_modules/json-wire-protocol/json-wire-protocol.js');
  }

  cross.require('responder', function(obj) {});

  cross.require('example-commands', function(obj) {
    context.exampleCmds = obj;
  });

  cross.require('support/device-interaction', function(obj) {
    context.DeviceInteraction = obj;
  });

  cross.require('support/socket', function(obj) {
    context.FakeSocket = obj;
  });

  cross.require('support/mock-driver', function(obj) {
    context.MockDriver = obj;
  });

}.call(this));
