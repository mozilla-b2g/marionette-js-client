describe('drivers/tcp-sync', function() {
  if (!cross.isNode)
    return test('only works on node');

  this.timeout(20000);
  var host = integration.host();
  var client;
  beforeEach(function() {
    client = host.client;
  });

  it('can execute sync commands', function() {
    client.goUrl('http://yahoo.com');
    client.goUrl('http://google.com');
    client.goUrl('http://yahoo.com');
    var location = client.executeScript(function() {
      return window.location.href;
    });
    expect(location.indexOf('yahoo.com') !== -1).to.be.ok();
  });

});

