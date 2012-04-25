(function(window){

  function FakeXhr(){
    this.openArgs = null;
    this.sendArgs = null;
    this.headers = {};
    this.responseHeaders = {};
  }

  FakeXhr.prototype = {
    open: function(){
      this.openArgs = arguments;
    },

    getResponseHeader: function(key){
      return this.responseHeaders[key];
    },

    setRequestHeader: function(key, value){
      this.headers[key] = value;
    },

    send: function(){
      this.sendArgs = arguments;
    }
  };

  window.FakeXhr = FakeXhr;

}(this));
