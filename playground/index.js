(function(window) {
  'strict mode';

  var Task = (function() {
    var current, done;

    return {
      start: function(generator, cb) {
        current = generator;
        if (!current.next) {
          current = generator.call(this);
        }

        done = cb;

        if (current && current.next) {
          current.next();
        }

        return this;
      },

      next: function(value) {
        try {
          current.send(value);
        } catch (e) {
          if (e instanceof StopIteration) {
            if (done)
              done();
            current = null;
            done = null;
          } else {
            current = null;
            done = null;
            throw e;
            if (done)
              done();
          }
        }
      }
    };
  }());


  Task.start(function() {
    var driver = new Marionette.Drivers.HttpdPolling(),
        client;

    yield driver.connect(function() { Task.next() });

    client = new Marionette.Client(driver, {
      defaultCallback: Task.next
    });

    yield client.startSession();
    yield client.setSearchTimeout(100000);

    yield client.goUrl('https://gist.github.com/2559125');
    el = yield client.findElement('div.data.type-javascript');
    console.log(yield el.text());

  });


}(this));
