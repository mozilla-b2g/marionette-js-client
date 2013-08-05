suite('element methods', function() {
  var client = marionette.client();

  test('#displayed', function() {
    client.goUrl('http://mozilla.org');
    var element = client.findElement('html');
    expect(element.displayed()).to.equal(true);
  });
});
