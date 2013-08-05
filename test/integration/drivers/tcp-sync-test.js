suite('drivers/tcp-sync', function() {
  var client = marionette.client();

  test('can execute sync commands', function() {
    client.goUrl('http://yahoo.com');
    client.goUrl('http://google.com');
    client.goUrl('http://yahoo.com');
    var location = client.executeScript(function() {
      return window.location.href;
    });
    expect(location.indexOf('yahoo.com') !== -1).to.be.ok();
  });

});

