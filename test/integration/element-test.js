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
    assert.ok(root.findElement('body').displayed());
  });

  test('#findElements', function() {
    var root = client.findElement('html');
    var elements = root.findElements('body');
    assert.ok(Array.isArray(elements), 'is an array');
    assert.ok(elements[0].displayed());
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
    // Create our dummy rect for the tests...
    client.executeScript(function() {
      var html =
        '<div id="magic-testing" style="width: 50px; height: 50px">woot</div>';
      document.body.insertAdjacentHTML('beforeend', html);
    });

    var element = client.findElement('#magic-testing');
    var rect = element.rect();
    console.log(rect);
    assert.ok('x' in rect, "is in the object");
    assert.ok('y' in rect, "is in the object");
    assert.equal(rect.width, 50);
    assert.equal(rect.height, 50);
  })
});
