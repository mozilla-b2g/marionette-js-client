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
        getUrl(log('get url')).
        getWindow(log('get window')).
        getWindows(log('get windows')).
        executeScript('window.location="http://google.com/"', log('executeScript')).
        goBack(log('back')).
        getUrl(log('get url')).
        goForward(log('go forward')).
        getUrl(log('get url 2'));
    });
  });

}(this));
