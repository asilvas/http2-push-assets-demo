'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function Http2PrefetchStatic(options) {
  (0, _assert2.default)(options.routes !== undefined, 'options.static.routes is required');

  // todo: add manifest cache support

  return function (req, res, cb) {
    var route = options.routes[req.url];
    if (!route) {
      return void cb();
    }

    // todo

    _fs2.default.readFile(route.manifest, 'utf8', function (err, data) {
      var manifest = JSON.parse(data);

      // push manifest
      var push = res.push('/client.js');
      push.writeHead(200);
      push.end(data);

      // push manifest files  
    });

    var push = res.push('/client.js');
    push.writeHead(200);
    _fs2.default.createReadStream(path.join(__dirname, '/client.js')).pipe(push);
  };
}

exports.default = Http2PrefetchStatic;