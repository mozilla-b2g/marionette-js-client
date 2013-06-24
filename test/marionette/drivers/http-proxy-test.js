describe('drivers/http-proxy', function() {
  if (!cross.isNode)
    return test('only works on node');

  var Client = require('../../../lib/marionette/client');
  var Driver = require('../../../lib/marionette/drivers/http-proxy');
  var host = require('marionette-host-environment');

  this.timeout(20000);

  var b2g;
  var driver;
  var client;

  before(function(done) {
    host.spawn(__dirname + '/../../b2g/', function(err, port, child) {
      if (err) throw err;

      b2g = child;

      driver = new Driver({
        marionettePort: port
      });
      driver.connect(function(err) {
        if (err) throw err;

        client = new Client(driver, {
          sync: true
        });

        client.startSession();
        done();
      });
    });
  });

  after(function() {
    client.deleteSession();
    b2g.kill();
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

