var fs = require('fs');
var operation = require('sync-operation').operation(process.argv);
var options = operation.options;

var client =
  (options.ssl) ? require('https') : require('http');

var req = client.request(options.request, function(res) {
  var responseText = '';
  res.setEncoding('utf8');

  res.on('data', function(content) {
    responseText += content;
  });

  res.on('end', function() {
    operation.end({
      error: '',
      status: res.statusCode,
      responseText: responseText
    });
  });

  res.on('error', function(err) {
    operation.end({
      error: {
        message: err.message,
        stack: err.stack
      }
    });
  });
});


if (options.data)
  req.write(options.data);

req.end();
