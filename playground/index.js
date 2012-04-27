(function(window) {

  var backend = new Marionette.Drivers.HttpdPolling();

  function log(logName) {
    if (logName) {
      return function() {
        console.log(logName, ':', arguments);
      }
    }
    console.log(arguments);
  }

  backend.connect(function() {
    var device = window.device = new Marionette.Client(backend);
    window.device.startSession(function() {
      device.
        setScriptTimeout(5000, log('setTimeout')).
        executeScript('return window.location;', log('executeScript')).
        executeJsScript('function magicFunc(){ return \'foo\'; } magicFunc();', log('executeJsScript')).
        executeAsyncScript('return window.location;', log('executeAsyncScript'));
    });
  });

}(this));
