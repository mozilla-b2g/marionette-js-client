var Xhr;

cross.require(
  'marionette/xhr',
  'Marionette.Xhr',
  function(obj){
    Xhr = obj;
  }
);

describe("marionette/xhr", function(){
  var subject, FakeXHR;

  FakeXHR = function(){
    this.openArgs = null;
    this.sendArgs = null;
    this.headers = {};
    this.responseHeaders = {};
  };

  FakeXHR.prototype = {
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

  describe("initialization", function(){
    beforeEach(function(){
      subject = new Xhr({
        method: 'POST'
      });
    });

    it("should set options on instance", function(){
      expect(subject.method).to.be('POST');
    });

    describe(".send", function(){

      var data = { a: true, b: false },
          url = 'http://foo',
          xhr,
          responseData,
          responseXhr;

      function callback(done, data, xhr){
        responseXhr = xhr;
        responseData = data;
        done();
      }

      function request(options){
        options.xhrClass = FakeXHR;
        subject = new Xhr(options);
      }

      function opensXHR(){
        it("should create xhr", function(){
          expect(subject.xhr).to.be.a(FakeXHR);
        });

        it("should set headers", function(){
          expect(subject.xhr.headers).to.eql(subject.headers);
        });

        it("should parse and send data", function(){
          expect(subject.xhr.sendArgs[0]).to.eql(JSON.stringify(subject.data));
        });

        it("should open xhr", function(){
          expect(subject.xhr.openArgs).to.eql([
            subject.method,
            subject.url,
            subject.async
          ]);
        });
      }

      beforeEach(function(){
        responseXhr = null;
        responseData = null;
      });

      describe("when xhr is a success and responds /w json", function(){
        var response = { works: true};

        beforeEach(function(done){
          var xhr;
          request({
            data: data,
            url: url,
            method: 'PUT'
          });

          subject.send(callback.bind(this, done));

          xhr = subject.xhr;
          xhr.responseHeaders['content-type'] = 'application/json';
          xhr.readyState = 4;
          xhr.responseText = JSON.stringify(response);
          xhr.onreadystatechange();
        });

        it("should send callback parsed data and xhr", function(){
          expect(responseXhr).to.be(subject.xhr);
          expect(responseData).to.eql(response);
        });

        opensXHR();
      });

    });

  });

});
