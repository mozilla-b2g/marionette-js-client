window.require = function xpcRequire(path, cb) {
  if (path[0] === '/') {
    path = __dirname + '/../' + path;
  }

  importScripts(path);
  if (typeof(cb) === 'function') {
    cb();
  }
};

importScripts(__dirname + '/../vendor/test-agent.js');
importScripts(__dirname + '/helper.js');
