(function(exports){
  if(typeof(exports.Marionette) === 'undefined'){
    exports.Marionette = {};
  }

  function merge(){
    var args = Array.prototype.slice.call(arguments),
        result = {};

    args.forEach(function(object){
      var key;
      for(key in object){
        if(object.hasOwnProperty(key)){
          result[key] = object[key];
        }
      }
    });
    return result;
  }

  function cmd(defaults){
    return function(override){
      if(typeof(override) === 'undefined'){
        override = {};
      }
      return merge(defaults, override);
    };
  }

  exports.Marionette.ExampleCommands = {
    connect: cmd(
      { from: 'root', applicationType: 'gecko', traits: [] }
    ),

    newSession: cmd(
      { type: 'newSession' }
    )
  };

}(
  (typeof(window) === 'undefined')? module.exports : window
));
