var util = require('util');
var Marionette = require('../lib/marionette/index');
var driver = new Marionette.Drivers.Tcp();

//var args = process.argv[2];
//
var script = function shitWorks() {
  document.body.addEventListener('load', function() {
    console.log('shit works!');
  });
}.toString();

driver.connect(function() {
  var throwMe;
  var client = new Marionette.Client(driver, {
    defaultCallback: function defaultCallback(err, value) {
      if (err) {
        console.log(err)
        throwMe = err;
      }
    }
  });

  client.
    startSession(function() {
      client.
        getUrl().
        setContext('content').
        findElement('#notifications-container', function(err, el) {
          el.getAttribute('outerHTML', function() {
            console.log('done??');
          });
          client.deleteSession(function deleteSes() {
            if (throwMe) {
              throw throwMe;
            }
          });
        })
  });
});

