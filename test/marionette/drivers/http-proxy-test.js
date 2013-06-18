describe('drivers/http-proxy', function() {
  if (!cross.isNode)
    return test('only works on node');

  var Client = require('../../../lib/marionette/client');
  var Driver = require('../../../lib/marionette/drivers/http-proxy');
  var host = require('marionette-host-environment');

  var b2g;
  var driver;
  var client;

  function fetchApps() {
    var appList = [];
    var mozApps = navigator.mozApps.mgmt;
    var req = mozApps.getAll();
    var manifests = [];

    function copy(input) {
      var obj = {};
      for (var key in input) {
        obj[key] = input[key];
      }
      return obj;
    }

    req.onsuccess = function(e) {
      var apps = e.target.result;
      for (var i = 0; i < apps.length; i++) {
        appList.push({
          name: apps[i].manifest.name,
          manifestURL: apps[i].manifestURL,
          entryPoints: apps[i].manifest.entry_points
        });

        if (apps[i].manifestURL.indexOf('calendar') !== -1) {
          apps[i].launch();
        }
      }
      marionetteScriptFinished(appList);
    };
    req.onerror = function() {
      marionetteScriptFinished();
    };
  }

  before(function(done) {
    this.timeout('100s');
    host.spawn(__dirname + '/../../../b2g/', function(err, port, child) {
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
        client.setScriptTimeout(50000);
        client.setContext('chrome');

        done();
      });
    });
  });

  after(function() {
    client.deleteSession();
    b2g.kill();
  });

  it('should fetch all app data from b2g', function() {
    var apps = client.executeAsyncScript(fetchApps);
    expect(apps).to.be.an('array');
  });

});

