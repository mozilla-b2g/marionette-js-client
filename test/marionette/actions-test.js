describe('marionette/actions', function() {
  var driver, subject, client, device,
      Actions, Client;

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
    subject = new Actions(client);
  });

  describe('initialization', function() {
    it('should set client', function() {
      expect(subject.client).to.be(client);
    });
  });

  describe('.press', function() {
    var element, x, y;

    beforeEach(function() {
      element = { id: '{fake-uuid-root}' };
      x = 0;
      y = 0;
      subject.press(element, x, y);
    });

    it('should have a press action in the chain', function() {
      var pressAction = [['press', element.id, x, y]];
      expect(subject.actionChain).to.eql(pressAction);
    });
  });

  describe('.release', function() {
    beforeEach(function() {
      subject.release();
    });

    it('should have a release action in the chain', function() {
      var releaseAction = [['release']];
      expect(subject.actionChain).to.eql(releaseAction);
    });
  });

  describe('.move', function() {
    var element;

    beforeEach(function() {
      element = { id: '{fake-uuid-root}' };
      subject.move(element);
    });

    it('should have a move action in the chain', function() {
      var moveAction = [['move', element.id]];
      expect(subject.actionChain).to.eql(moveAction);
    });
  });

  describe('.moveByOffset', function() {
    var x, y;

    beforeEach(function() {
      x = 1;
      y = 1;
      subject.moveByOffset(x, y);
    });

    it('should have a move by offset action in the chain', function() {
      var moveByOffsetAction = [['moveByOffset', x, y]];
      expect(subject.actionChain).to.eql(moveByOffsetAction);
    });
  });

  describe('.wait', function() {
    var time;

    beforeEach(function() {
      time = 1;
      subject.wait(time);
    });

    it('should have a wait action in the chain', function() {
      var waitAction = [['wait', time]];
      expect(subject.actionChain).to.eql(waitAction);
    });
  });

  describe('.cancel', function() {
    beforeEach(function() {
      subject.cancel();
    });

    it('should have a cancel action in the chain', function() {
      var cancelAction = [['cancel']];
      expect(subject.actionChain).to.eql(cancelAction);
    });
  });

  describe('.tap', function() {
    var element, x, y;

    beforeEach(function() {
      element = { id: '{fake-uuid-root}' };
      x = 0;
      y = 0;
      subject.tap(element, x, y);
    });

    it('should have a tap action in the chain', function() {
      var tapAction = [
        ['press', element.id, x, y],
        ['release']
      ];

      expect(subject.actionChain).to.eql(tapAction);
    });
  });

  describe('.doubleTap', function() {
    var element, x, y;

    beforeEach(function() {
      element = { id: '{fake-uuid-root}' };
      x = 0;
      y = 0;
      subject.doubleTap(element, x, y);
    });

    it('should have a double tap action in the chain', function() {
      var doubleTapAction = [
        ['press', element.id, x, y],
        ['release'],
        ['press', element.id, x, y],
        ['release']
      ];

      expect(subject.actionChain).to.eql(doubleTapAction);
    });
  });

  describe('.flick', function() {
    var element, x1, y1, x2, y2;

    beforeEach(function() {
      element = { id: '{fake-uuid-root}' };
      x1 = 0;
      y1 = 0;
      x2 = 100;
      y2 = 100;
    });

    function shouldHaveFlickAction() {
      var firstAction = ['press', element.id, x1, y1];
      var lastAction = ['release'];
      var lastActionIndex = subject.actionChain.length - 1;

      expect(subject.actionChain[0]).to.eql(firstAction);
      for (var i = 1; i < lastActionIndex; i += 2) {
        expect(subject.actionChain[i][0]).to.eql('moveByOffset');
        expect(subject.actionChain[i + 1][0]).to.eql('wait');
      }
      expect(subject.actionChain[lastActionIndex]).to.eql(lastAction);
    }

    it('should have a flick action in the chain', function() {
      subject.flick(element, x1, y1, x2, y2);
      shouldHaveFlickAction();
    });

    it('should have a flick action in the chain ' +
       'when the duration param is 300', function() {
      var duration = 300;
      subject.flick(element, x1, y1, x2, y2, duration);
      shouldHaveFlickAction();
    });
  });


  describe('.longPress', function() {
    var element, time;

    beforeEach(function() {
      element = { id: '{fake-uuid-root}' };
      time = 1;
      subject.longPress(element, time);
    });

    it('should have a long press action in the chain', function() {
      var longPressAction = [
        ['press', element.id],
        ['wait', time],
        ['release']
      ];

      expect(subject.actionChain).to.eql(longPressAction);
    });
  });

  describe('.perform', function() {
    device.
      issues('perform').
      shouldSend({
        type: 'actionChain',
        chain: [],
        nextId: null
      }).
      serverResponds('value').
      callbackReceives('value');
  });
});
