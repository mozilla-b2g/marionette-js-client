describe('scope', function() {
  var host = integration.host();
  var device, client, subject;

  cross.require('actions', function(obj) {
    Actions = obj;
  });

  device = new DeviceInteraction(exampleCmds, function() {
    return subject;
  });

  beforeEach(function() {
    client = host.client;
  });

  describe('actions', function() {
    beforeEach(function() {
      subject = new Actions(client);
    });

    it('can move the page', function() {
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
        moveByOffset(0, -10).
        wait(0.05).
        release().
        wait(0.05).
        flick(bodyElement, 0, 500, 0, 600).
        perform();

      expect(subject.actionChain).to.be.eql([]);
    });
  });
});
