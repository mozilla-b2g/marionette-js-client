/**
 * Helpers for integration tests (which only run using node node)
 */
var FILE_SERVE = __dirname + '/integration/public/',
    PORT = 60043,
    B2G_PATH = __dirname + '/b2g';

/**
 * creates a http server to use inside of tests.
 * Intended to be used inside of a mocha test only.
 *
 * @return {String} root of publicly served files.
 */
function server() {
  var server,
      spawn = require('child_process').spawn;

  before(function() {
    var bin = __dirname + '/../node_modules/node-static/bin/cli.js';
    server = spawn(bin, ['-p ' + PORT], { cwd: FILE_SERVE });
  });

  after(function() {
    server.kill();
  });

  // return the root url to use in tests
  return 'http://localhost:' + PORT + '/';
}

/**
 * Creates a marionette host environment.
 *
 *    var host = helper.host();
 *    host.process; // host process
 *    host.client; // marionette client
 *
 * @return {Object} object with references to the client/process.
 */
function host() {
  var ctx = {};
  var marionetteHost = require('marionette-host-environment');

  beforeEach(function(done) {
    var Client = require('../lib/marionette/client');
    var Driver = require('../lib/marionette/drivers/tcp-sync');
    var timeout = 10000;
    this.timeout(timeout);

    marionetteHost.spawn(B2G_PATH, function(err, port, child) {
      if (err) throw err;
      ctx.process = child;

      var driver = new Driver({
        port: port,
        // Specify a longer timeout in order to support running tests on
        // under-powered machines
        connectionTimeout: timeout
      });
      driver.connect(function(err) {
        if (err) throw err;
        ctx.client = new Client(driver, { sync: true });
        ctx.client.startSession();
        done();
      });
    });
  });

  afterEach(function() {
    ctx.client.deleteSession();
    ctx.process.kill();
  });

  return ctx;
}

module.exports.host = host;
module.exports.server = server;
