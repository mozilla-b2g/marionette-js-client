suite('error handling', function() {
  var client = marionette.client();

  test('catch error', function() {
    try {
      client.executeScript(function() {
        throw new Error('e');
      });
    } catch (e) {
      e.client.screenshot();
    }
  });
});
