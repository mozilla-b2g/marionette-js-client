describe('marionette/error', function() {

  var MarionetteError;

  cross.require('error', function(obj) {
    MarionetteError = obj;
  });

  it('should expose .CODES', function() {
    expect(Object.keys(MarionetteError.CODES).length).to.be.greaterThan(0);
  });

  describe('#error', function() {
    it('should have support for each error', function() {
      for (var key in MarionetteError.CODES) {
        err = new MarionetteError({
          message: 'msg',
          status: key,
          stacktrace: 'stack'
        });
        expect(err.type).to.be(MarionetteError.CODES[key]);
        expect(err.message).to.contain(key);
        expect(err.message).to.contain('stack');
        expect(err.message).to.contain('msg');
        expect(err.stack).to.be.ok();
        expect(err).to.be.a(Error);
      }
    });

    it('should use 500 error when unknown stack is given', function() {
      var result = new MarionetteError({
        status: 7777,
        message: 'foo',
        stack: 'bar'
      });

      expect(result.name).to.be(MarionetteError.CODES[500]);
    });
  });

});
