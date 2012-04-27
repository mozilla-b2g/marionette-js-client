(function(window){

  var backend = new Marionette.Drivers.HttpdPolling();

  function log(){
    console.log(arguments);
  }

  backend.connect(function(){
    var device = window.device = new Marionette.Client(backend);
    window.device.startSession(function(){
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
