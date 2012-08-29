(function(window) {
  'strict mode';

  importScripts('../marionette.js');

  console.log(Marionette.Drivers);
  var driver = new Marionette.Drivers.MozTcp();

driver.connect(function() {
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

  window.xpcEventLoop.start();
}(this));

