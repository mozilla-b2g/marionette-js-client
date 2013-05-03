var util = require('util');

var Marionette = require('../lib/marionette/index');
var driver = new Marionette.Drivers.HttpProxy();

process.on('uncaughtException', function() {
  client.deleteSession();
});

function defaultCB(err, result) {
  return result;
}

var client = new Marionette.Client(driver);

client.startSession();


client.setScriptTimeout(50000);
client.setContext('chrome');
var apps = client.executeAsyncScript(function() {
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
      dump('ENTRYPOINT?:' + JSON.stringify(apps[i].manifest.entry_points) + '\n\n');
      appList.push({
        //name: apps[i].manifest.name,
        //manifestURL: apps[i].manifestURL,
        entryPoints: apps[i].manifest.entry_points
      });
    }
    marionetteScriptFinished(appList);
  };
  req.onerror = function() {
    marionetteScriptFinished();
  };

});

console.log(apps);

client.deleteSession();
