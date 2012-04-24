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

    getMarionetteID: cmd(
      { type: 'getMarionetteID' }
    ),

    getMarionetteIDResponse: cmd(
      { from: 'root', id: 'con1' }
    ),

    newSession: cmd(
      { type: 'newSession' }
    ),

    newSessionResponse: cmd(
      { from: 'actor', value: 'b2g-7' }
    )

  };

}(
  (typeof(window) === 'undefined')? module.exports : window
));
