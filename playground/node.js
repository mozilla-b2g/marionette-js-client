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
  console.log('CONNECTED!');
  var client = new Marionette.Client(driver, {
    defaultCallback: function(value) {
      console.log('--- response start --');
      console.log(arguments)
      console.log('--- response end --');
    }
  });

  client.
    startSession(function() {
      client.
        getUrl().
        setContext('content').
        executeAsyncScript(script, function(out) {
          console.log(util.inspect(out, true));
        }, 1000).
        deleteSession();
    });
});

