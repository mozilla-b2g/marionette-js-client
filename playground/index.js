(function(window){

  var backend = new Marionette.Backends.HttpdPolling({
    proxyUrl: '/marionette'
  });

  function log(){
    console.log(arguments);
  }

  backend.connect(function(){
    var device = window.device = new Marionette.Client(backend);
    window.device.startSession(function(){
      device.send({
        type: 'getUrl'
      }, function(data){
        console.log(data.value);
      });
    });
  });


}(this));
