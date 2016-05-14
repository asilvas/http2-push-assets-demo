'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _constants = require('../constants');

var _constants2 = _interopRequireDefault(_constants);

var _util = require('../util');

var _util2 = _interopRequireDefault(_util);

var _fixed = require('../fixed');

var _fixed2 = _interopRequireDefault(_fixed);

var _dynamic = require('../dynamic');

var _dynamic2 = _interopRequireDefault(_dynamic);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function Http2DependsConnect(connect, options) {
  (0, _assert2.default)(options !== undefined, 'Options required');
  (0, _assert2.default)(_typeof(options.fixed) === 'object' || options.dynamic, 'options.fixed OR options.dynamic required');

  var handler = options.fixed ? (0, _fixed2.default)(connect, options.fixed) : (0, _dynamic2.default)(connect, options.dynamic);

  return function (req, res, next) {
    console.log('Http2DependsConnect', req.url);
    console.log('* httpVersion', req.httpVersion, req.httpVersionMajor);
    console.log('* Headers', req.headers);

    if (!req.httpVersionMajor || req.httpVersionMajor < 2) {
      return void next();
    }

    var documents = _util2.default.parseHeader(req.headers[_constants2.default.REQUEST_HEADER]) || options.forcePush && {};
    if (!documents) {
      // if header not provided (or force not set), this feature is disabled
      return void next();
    }
    console.log('* ' + _constants2.default.REQUEST_HEADER, documents);

    handler(documents, req, res, next);
  };
}

exports.default = Http2DependsConnect;