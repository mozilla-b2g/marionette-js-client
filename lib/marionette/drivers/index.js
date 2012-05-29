(function(module, ns) {

  module.exports = {
    Abstract: ns.require('drivers/abstract'),
    HttpdPolling: ns.require('drivers/httpd-polling'),
    Websocket: ns.require('drivers/websocket')
  };

  if (typeof(window) === 'undefined') {
    module.exports.Tcp = require('./tcp');
  }

}.apply(
  this,
  (this.Marionette) ?
    [Marionette('drivers'), Marionette] :
    [module, require('../marionette')]
));
