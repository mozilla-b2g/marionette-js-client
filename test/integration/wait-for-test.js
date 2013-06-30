describe('scope', function() {
  // create test resources
  var host = integration.host(),
      client;

  beforeEach(function() {
    client = host.client;
  });

  describe('sync waitFor', function() {
    it('should not yield in sync code', function() {
      var tries = 0;
      var succeed = 10;

      var i = 1;
      // short signature
      client.waitFor(function() {
        return (++tries === succeed);
      });

      expect(tries).to.be(10);
    });

    it('should eventually timeout', function() {
      var timeout = 450;
      var start = Date.now();
      var err;
      try {
        client.waitFor(function() {
          return false;
        }, { timeout: timeout });
      } catch (e) {
        err = e;
      }

      expect(err).to.be.ok();
      expect((Date.now() - start) >= timeout).to.be.ok();
    });
  });

  describe('async wait for calls', function() {
    it('should fire when async condition is met', function(done) {
      var tries = 0;
      var success = 3;
      client.waitFor(function(done) {
        setTimeout(done, 5, ++tries === success);
      }, done);
    });
  });
});

