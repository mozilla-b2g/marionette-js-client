/**
 * Runs http proxy to marionette client in a forked process
 *   specifically for http-proxy driver
 */
if (!process.send) {
  console.error('Http proxy runner must be forked');
  process.exit();
}

var ProxyServer = require('./node/http-proxy.js');

// grab hostname and port to run on if provided
var options = {};
if (process.argv[2]) {
  options.port = process.argv[2];
}
if (process.argv[3]) {
  options.hostname = process.argv[3];
}

var server = new ProxyServer(options);
server.listen(function() {
  process.send('ready');
});

