(function(module, ns) {

  var exports = module.exports;

  console.log(ns._paths.drivers);

  exports.Element = ns.require('element');
  exports.Client = ns.require('client');
  exports.Xhr = ns.require('xhr');
  exports.Drivers = ns.require('drivers');

}.apply(
  this,
  (this.Marionette) ?
    [Marionette, Marionette] :
    [module, require('./marionette')]
));
