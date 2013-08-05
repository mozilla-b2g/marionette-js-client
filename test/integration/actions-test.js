suite('scope', function() {
  var client = marionette.client(),
      device,
      subject;

  cross.require('actions', function(obj) {
    Actions = obj;
  });

  device = new DeviceInteraction(exampleCmds, function() {
    return subject;
  });

  suite('actions', function() {
    setup(function() {
      subject = new Actions(client);
    });

    test('can move the page', function() {
      var bodyElement;

      client.goUrl('http://yahoo.com');
      client.waitFor(function() {
        client.findElement('body', function(error, element) {
          if (error) {
            console.log('cannot find');
            return;
          }
          bodyElement = element;
        });

        if (bodyElement !== undefined) {
          return true;
        }
      });

      subject.
        press(bodyElement, 100, 100).
        moveByOffset(0, 10).
        wait(0.05).
        release().
        wait(0.05).
        flick(bodyElement, 0, 0, 0, 200).
        perform();

    });
  });
});
