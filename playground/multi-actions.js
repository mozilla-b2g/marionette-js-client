/**
 * Please use b2g device to run this example with
 * following commands.
 *
 * 1. adb forward tcp:2828 tcp:2828
 * 2. DEBUG=* node ./playground/multi-actions.js
 */

var Marionette = require('../lib/marionette/index');
var Driver = require('../lib/marionette/drivers/http-proxy');

var driver = new Driver({ marionettePort: 2828 });
driver.connect(function(err) {
  if (err) throw err;
  var client = new Marionette.Client(driver, { sync: true });
  var linkeElement;

  client.startSession();
  client.goUrl('http://yahoo.com');

  client.waitFor(function() {
    client.findElement('body', function(err, element) {
      if (err) {
        console.log('cannot find');
        return;
      }
      linkeElement = element.displayed();
    });

    if (linkeElement !== undefined) {
      return true;
    }
  });

  var action1 = new Marionette.Actions(client);
  action1.flick(linkeElement, 100, 100, 0, 0);

  var multiActions = new Marionette.MultiActions(client);
  multiActions.add(action1).perform();
});
