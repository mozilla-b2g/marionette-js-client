(function(window) {
  'strict mode';

  importScripts('../marionette.js');

  var driver = new Marionette.Drivers.MozTcp();

  driver.connect(function() {
     var client = new Marionette.Client(driver);
     client.startSession(function() {
       client.goUrl('http://google.com', function(e) {
         client.deleteSession(function(){
           window.xpcEventLoop.stop(); 
         });
       });
     });
  });


  window.xpcEventLoop.start();
}(this));

