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
    var evaled = element.scriptWith(function() {
      return '111';
    });

    assert.equal(evaled, '111');
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
});
