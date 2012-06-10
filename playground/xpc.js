(function(window) {
  'strict mode';

  importScripts('../marionette.js');

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
        findElement('fooza').
        //executeScript('function zoomba() { a(); } zoomba();').
        deleteSession(function deleteSes() {
          window.xpcEventLoop.stop();
          if (throwMe) {
            throw throwMe;
          }
        });
    });
});

  window.xpcEventLoop.start();
}(this));

