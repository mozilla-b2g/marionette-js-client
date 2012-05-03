var Marionette = require('../lib/marionette/index');

var driver = new Marionette.Drivers.HttpdPolling({
  proxyUrl: 'http://localhost:8080/marionette'
});

driver.connect(function() {
  var client = new Marionette.Client(driver, {
    defaultCallback: function(value) {
      console.log('--- response start --');
      console.log(arguments)
      console.log('--- response end --');
    }
  });

  client.
    startSession(function() {
      client.goUrl('http://github.com', function() {
                console.log('DONE GO URL');
             }).
             deleteSession(function() {
               console.log('USER CB DELETE SESSION');
             });
    });

});

