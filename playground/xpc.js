(function(window) {
  'strict mode';

  importScripts('../marionette.js');
  var driver = new Marionette.Drivers.HttpProxy();
  var client = new Marionette.Client(driver);

  client.startSession();
  client.goUrl('http://google.com');
  var el = client.findElement('input[name=\'q\']');
  console.log(el);
  el.sendKeys('zomg');
  client.destroySession();

}(this));

