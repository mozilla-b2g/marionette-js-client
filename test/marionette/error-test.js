describe('marionette/error', function() {

  var subject;

  cross.require('error', function(obj) {
    subject = obj;
  });

  describe('.codes', function() {
    it('should contain a list of all error codes', function() {
      expect(subject.codes).to.be.a(Object);
      var len = Object.keys(subject.codes).length;

      expect(len > 10).to.be.ok();
    });
  });

  describe('#error', function() {
    it('should have support for each error', function() {
      //this test is *WAY* too slow under xpcshell

      if (typeof(window) !== 'undefined' && window.xpcDump) {
        return;
      }

      var key, err;

      for (key in subject.codes) {
        err = subject.error({
          message: 'msg',
          status: key,
          stacktrace: 'stack'
        });
        expect(err.type).to.be(subject.codes[key]);
        expect(err.message).to.contain(key);
        expect(err.message).to.contain('stack');
        expect(err.message).to.contain('msg');
        expect(err.stack).to.be.ok();
        expect(err).to.be.a(Error);
        expect(err).to.be.a(subject.Exception);
      }
    });

    it('should use 500 error when unknown stack is given', function() {
      var result = subject.error({
        status: 7777,
        message: 'foo',
        stack: 'bar'
      });

      expect(result).to.be.a(subject.GenericError);
    });

    it('should not process marionette exceptions', function() {
      var result, input;

      input = new subject.GenericError({});
      result = subject.error(input);

      expect(result).to.be(input);
    });

    it('should not process non-marionette objects', function() {
      var result, input = { foo: true };

      result = subject.error(input);
      expect(result).to.be(input);
    });

  });

});
