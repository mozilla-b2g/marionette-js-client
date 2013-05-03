(function(window) {
  'strict mode';


  var driver = new Marionette.Drivers.HttpProxy();
  var client = new Marionette.Client(driver);

  client.startSession();
  client.goUrl('http://google.com');
  var el = client.findElement('input[name=\'q\']');
  el.sendKeys('zomg');

}(this));
