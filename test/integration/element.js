suite('element methods', function() {
  var host = integration.host();
  var client;

  setup(function() {
    client = host.client;
  });

  test('#displayed', function() {
    client.goUrl('http://mozilla.org');
    var element = client.findElement('html');
    expect(element.displayed()).to.equal(true);
  });
});
