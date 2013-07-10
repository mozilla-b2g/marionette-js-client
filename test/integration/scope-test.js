describe('scope', function() {
  // create test resources
  var host = integration.host();

  var client,
      timeoutA,
      timeoutB;

  beforeEach(function() {
    client = host.client;
    timeoutA = client.scope({ scriptTimeout: 1000 });
    timeoutB = client.scope({ scriptTimeout: 250 });
  });

  it('should handle scope switching', function() {
    function sleep() {
      setTimeout(function() {
        marionetteScriptFinished();
      }, 600);
    }

    timeoutA.executeAsyncScript(sleep);

    var err;
    try {
      timeoutB.executeAsyncScript(sleep);
    } catch (e) {
      err = e;
    }
    // sleep throws error on shorter timeout
    expect(err).to.be.ok();
  });
});
