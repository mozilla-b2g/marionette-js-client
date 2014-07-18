suite('element methods', function() {
  var Marionette = require('../../');
  // TODO: use a static server
  var URL = 'http://mozilla.org';

  var client = marionette.client();

  setup(function() {
    client.goUrl(URL);
  });

  test('#displayed', function() {
    var element = client.findElement('html');
    assert.strictEqual(element.displayed(), true);
  });

  test('#scriptWith', function() {
    var element = client.findElement('html');
    var evaled = element.scriptWith(function(el, arg) {
      return el.tagName + ' ' + arg;
    }, ['FTW!']);

    assert.equal(evaled, 'HTML FTW!');
  });

  test('#findElement', function() {
    var root = client.findElement('html');
    assert.ok(
      root.findElement('body') instanceof Marionette.Element,
      'returns instanceof Marionette.Element'
    );
  });

  test('#findElements', function() {
    var root = client.findElement('html');
    var elements = root.findElements('body');
    assert.ok(Array.isArray(elements), 'is an array');

    assert.ok(
      elements[0] instanceof Marionette.Element,
      'returns instances of Marionette.Element'
    );
  });

  test('#findElement - missing', function() {
    var err;
    try {
      client.findElement('#fooobaramazingmissing');
    } catch(e) {
      err = e;
    }

    if (!err) throw new Error('missing element did not trigger an error');
    assert.equal(err.type, 'NoSuchElement');
  });

  test('#cssProperty', function() {
    var body = client.findElement('body');
    var font = body.cssProperty('font-size');
    assert.ok(font, 'returns a css property value');
  });

  test('#rect', function () {
    var accordian = client.findElement('.accordian');
    var accordianRect = accordian.rect();
    assert.ok(rect.x, "is in the object");
    assert.ok(rect.y, "is in the object");
    assert.ok(rect.height, "is in the object");
    assert.ok(rect.width, "is in the object");

  })
});
