(function(window){

  var backend = new Marionette.Backends.HttpdPolling({
    proxyUrl: '/marionette'
  });

  function log(){
    console.log(arguments);
  }

  backend.connect(function(){
    var device = window.device = new Marionette.Client(backend);
    console.log(device);
    window.device.startSession(function(){
      console.log('starting session');
      device.send({
        type: 'executeScript',
        value: 'return window.location',
        args: []
      }, function(data){
        console.log(data.value);
      });
    });
  });


}(this));
