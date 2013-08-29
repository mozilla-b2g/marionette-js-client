suite('marionette/error', function() {

  var MarionetteError;

  helper.require('error', function(obj) {
    MarionetteError = obj;
  });

  test('should expose .CODES', function() {
    assert.operator(Object.keys(MarionetteError.CODES).length, '>', 0);
  });

  suite('#error', function() {
    test('should have support for each error', function() {
      for (var key in MarionetteError.CODES) {
        err = new MarionetteError({
          message: 'msg',
          status: key,
          stacktrace: 'stack'
        });
        assert.strictEqual(err.type, MarionetteError.CODES[key]);
        assert.include(err.message, key);
        assert.include(err.message, 'stack');
        assert.include(err.message, 'msg');
        assert.ok(err.stack);
        assert.instanceOf(err, Error);
      }
    });

    test('should return given when given is a MarionetteError', function() {
      var input = new MarionetteError({});
      var result = new MarionetteError(input);
      assert.equal(input, result);
    });

    test('should use 500 error when unknown stack is given', function() {
      var result = new MarionetteError({
        status: 7777,
        message: 'foo',
        stack: 'bar'
      });

      assert.strictEqual(result.name, MarionetteError.CODES[500]);
    });
  });

});
