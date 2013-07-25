describe('marionette/multi-actions', function() {
  var driver, subject, actions, client, device,
      MultiActions, Actions, Client;

  cross.require('multi-actions', function(obj) {
    MultiActions = obj;
  });

  cross.require('actions', function(obj) {
    Actions = obj;
  });

  cross.require('client', function(obj) {
    Client = obj;
  });

  device = new DeviceInteraction(exampleCmds, function() {
    return subject;
  });

  beforeEach(function() {
    driver = new MockDriver();
    client = new Client(driver);
    actions = new Actions(client);
    subject = new MultiActions(client);
  });

  describe('initialization', function() {
    it('should set client', function() {
      expect(subject.client).to.be(client);
    });
  });

  describe('.add', function() {
    beforeEach(function() {
      subject.add(actions);
    });

    it('should have a action chain', function() {
      expect(subject.multiActions[0]).to.be.eql(actions.actionChain);
    });
  });

  describe('.perform', function() {
    device.
      issues('perform').
      shouldSend({
        type: 'multiAction',
        value: [],
        max_length: 0
      }).
      serverResponds('ok').
      callbackReceives('ok');
  });
});
