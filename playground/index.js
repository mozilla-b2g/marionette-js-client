(function(window) {
  'strict mode';


  var driver = new Marionette.Drivers.HttpdPolling();

  driver.connect(function() {
     var client = new Marionette.Client(driver);
     client.startSession(function() {
       client.goUrl('http://google.com', function(e) {
        var el = client.findElement('input[name=\'q\']', function(el) {
          el.sendKeys('zomg', function(){
          
          });
        });
       });
     });
  });


}(this));
