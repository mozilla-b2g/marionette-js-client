(function(window) {

  var backend = new Marionette.Drivers.HttpdPolling();

  function log(logName) {
    if (logName) {
      return function(data) {
        console.log(logName, ':', data);
      }
    }
    console.log(arguments);
  }

  backend.connect(function() {
    var device = window.device = new Marionette.Client(backend);
    window.device.startSession(function() {
      device.
        findElements('div', log('findElement'));
    });
  });

}(this));
