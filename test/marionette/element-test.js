var Client, cmds, MockDriver,
    DeviceInteraction, Element;

cross.require(
  'marionette/client',
  'Marionette.Client', function(obj) {
    Client = obj;
  }
);

cross.require(
  'marionette/element',
  'Marionette.Element', function(obj) {
    Element = obj;
  }
);

cross.require(
  'marionette/example-commands',
  'Marionette.ExampleCommands',
  function(obj) {
    cmds = obj;
  }
);


cross.require(
  '../test/support/mock-driver',
  'MockDriver',
  function(obj) {
    MockDriver = obj;
  }
);

cross.require(
  '../test/support/device-interaction',
  'DeviceInteraction',
  function(obj) {
    DeviceInteraction = obj;
    test();
  }
);

//this is hack to ensure device interactions are
//loaded
function test() {

describe('marionette/element', function() {
  var driver, subject, client, id, device;

  id = '{fake-uuid-root}';

  function simpleCommand(method, type, responseKey) {
    describe('.' + method, function() {
      device.
        issues(method).
        shouldSend({
          type: type,
          element: id
        }).
        serverResponds(responseKey).
        callbackReceives(responseKey);
    });
  }

  device = new DeviceInteraction(cmds, function() {
    return subject;
  });

  beforeEach(function() {
    driver = new MockDriver();
    client = new Client(driver);
    subject = new Element(id, client);
  });

  describe('initialization', function() {
    it('should set id', function() {
      expect(subject.id).to.be(id);
    });

    it('should set client', function() {
      expect(subject.client).to.be(client);
    });
  });

  describe('._sendCommand', function() {
    device.
      issues('_sendCommand', { type: 'test' }, 'ok').
      shouldSend({ type: 'test', element: id }).
      serverResponds('ok').
      callbackReceives('ok');
  });

  describe('.findElement', function() {
    device.
      issues('findElement', '#id').
      shouldSend({
        value: '#id',
        type: 'findElement',
        element: id
      }).
      serverResponds('findElementResponse').
      callbackReceives('value');
  });

  describe('.findElements', function() {
    device.
      issues('findElements', '#id').
      shouldSend({
        value: '#id',
        type: 'findElements',
        element: id
      }).
      serverResponds('findElementsResponse').
      callbackReceives('value');
  });

  describe('.equals', function() {
    var otherId = 'foo';

    describe('when given an id', function() {
      device.
        issues('equals', otherId).
        shouldSend({
          type: 'elementsEqual',
          elements: [id, otherId]
        }).
        serverResponds('value').
        callbackReceives('value');
    });

    describe('when given an element instance', function() {
      beforeEach(function() {
        var element = new Element(otherId, device);
        subject.equals(element, device.commandCallback);
      });

      device.
        shouldSend({
          type: 'elementsEqual',
          elements: [id, otherId]
        }).
        serverResponds('elementEqualsResponse').
        callbackReceives('value');

    });

  });

  describe('.getAttribute', function() {
    var attr = 'name';

    device.
      issues('getAttribute', attr).
      shouldSend({
        type: 'getAttribute',
        name: attr,
        element: id
      }).
      serverResponds('value').
      callbackReceives('value');
  });

  describe('.sendKeys', function() {
    var msg = 'foo';

    device.
      issues('sendKeys', msg).
      shouldSend({
        type: 'sendKeysToElement',
        value: msg,
        element: id
      }).
      serverResponds('ok').
      callbackReceives('ok');
  });

  simpleCommand('click', 'clickElement', 'value');
  simpleCommand('text', 'getElementText', 'value');
  simpleCommand('value', 'getElementValue', 'value');
  simpleCommand('clear', 'clearElement', 'ok');
  simpleCommand('selected', 'isElementSelected', 'value');
  simpleCommand('enabled', 'isElementEnabled', 'value');
  simpleCommand('displayed', 'isElementDisplayed', 'value');

});

}
