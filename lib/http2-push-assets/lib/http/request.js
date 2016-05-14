'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _http = require('http2');

var _http2 = _interopRequireDefault(_http);

var _util = require('../util');

var _util2 = _interopRequireDefault(_util);

var _constants = require('../constants');

var _constants2 = _interopRequireDefault(_constants);

var _extend = require('extend');

var _extend2 = _interopRequireDefault(_extend);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function Http2DependsRequest(url, reqOptions, cb) {
  if ((typeof url === 'undefined' ? 'undefined' : _typeof(url)) === 'object') {
    cb = reqOptions;
    reqOptions = url;
    url = reqOptions.url;
  }

  // copy original
  var options = (0, _extend2.default)(true, { headers: {} }, reqOptions || {});

  var resRemaining = 1; // track remaining responses to wait for
  var files = [];
  var body, mainRes;

  if (!options.headers[_constants2.default.REQUEST_HEADER]) {
    // if not provided, reconstruct header from files
    options.headers[_constants2.default.REQUEST_HEADER] = _util2.default.buildHeaderFromFiles(options.files);
    (options.files || []).forEach(function (f) {
      if (_util2.default.isAssetNoPush(f)) {
        // if no-push is enabled on an asset, pass reference to return collection to avoid client from requesting cached files
        f.noPush = true;
        files.push(f);
      } else {
        f.noPush = false;
      }
    });
  }

  var finish = function finish() {
    resRemaining--;
    //console.log('client.finish.remaining:', resRemaining, 'handles:', process._getActiveHandles().length);
    if (resRemaining === 0) {
      cb(null, mainRes, body, files);
    }
  };

  var req = _http2.default.request(options);

  req.on('response', function (res) {
    var parts = [];

    mainRes = res;

    var isUtf8 = _util2.default.isContentTypeUtf8(res.headers['content-type']);
    if (isUtf8) {
      res.setEncoding('utf8');
    }

    res.on('data', function (chunk) {
      parts.push(chunk);
    });

    res.on('finish', function () {
      var fileData = isUtf8 ? parts.join('') : Buffer.concat(parts);

      body = fileData;

      finish();
    });
  });

  req.on('push', function (req) {
    resRemaining++;

    var parts = [];

    req.on('response', function (res) {
      var isUtf8 = _util2.default.isContentTypeUtf8(res.headers['content-type']);
      if (isUtf8) {
        res.setEncoding('utf8');
      }
      res.on('data', function (chunk) {
        parts.push(chunk);
      });

      res.on('finish', function () {
        var fileData = isUtf8 ? parts.join('') : Buffer.concat(parts);

        files.push({
          url: req.url,
          pushKey: res.headers[_constants2.default.PUSH_RESPONSE_KEY_HEADER] || _crypto2.default.createHash('md5').update(req.url).digest("hex"),
          statusCode: res.statusCode,
          headers: res.headers,
          body: fileData
        });

        finish();
      });
    });
  });

  req.on('error', function (err) {
    cb(err);
  });

  req.end();
}

exports.default = Http2DependsRequest;