'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _parseurl = require('parseurl');

var _parseurl2 = _interopRequireDefault(_parseurl);

var _util = require('../util');

var _util2 = _interopRequireDefault(_util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var headersToCopy = ['accept-encoding', 'accept-language', 'authorization', 'host', 'connection'];

function Http2DependsFixed(connect, options) {
  (0, _assert2.default)(options.manifests !== undefined, 'options.fixed.manifests is required');

  var routes = {};
  var routeCount = 0;
  Object.keys(options.manifests).forEach(function (manifestRoute) {
    var manifest = options.manifests[manifestRoute];

    manifest.routes.forEach(function (route) {
      routes[route] = {
        url: route,
        manifestRoute: manifestRoute,
        manifestPath: manifest.path
      };

      routeCount++;
    });
  });

  (0, _assert2.default)(routeCount > 0, 'options.fixed.manifests must define at least one route');

  // todo: add manifest cache support

  return function (requestAssets, req, res, next) {
    var parsedUrl = (0, _parseurl2.default)(req);
    var route = routes[parsedUrl.pathname];
    if (!route) {
      // route not found, continue
      return void next();
    }

    // todo: add cache support
    _fs2.default.readFile(route.manifestPath, 'utf8', function (err, data) {
      var manifest = JSON.parse(data);

      // push manifest assets
      _util2.default.pushAssets(connect, req, res, requestAssets, manifest.assets);

      // do not wait for push assets to be sent, promise is only requirement
      next();
    });
  };
}

exports.default = Http2DependsFixed;