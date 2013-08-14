/**
 * @const {string}
 */
var MOZILLA_URL = 'https://mozilla.org';


suite('element methods', function() {
  var client = marionette.client();

  var el;
  setup(function() {
    client.goUrl(MOZILLA_URL);
    el = client.findElement('html');
  });

  test('#displayed', function() {
    assert.strictEqual(el.displayed(), true);
  });

  test('#text', function() {
    var text = el.text();
    assert.strictEqual(typeof text, 'string');
    assert.ok(text.length > 0);
    assert.ok(text.indexOf('Firefox') !== -1);
  });
});
