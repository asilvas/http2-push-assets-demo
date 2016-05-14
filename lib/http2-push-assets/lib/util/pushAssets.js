'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = pushAssets;

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _copyHeaders = require('./copyHeaders');

var _copyHeaders2 = _interopRequireDefault(_copyHeaders);

var _constants = require('../constants');

var _constants2 = _interopRequireDefault(_constants);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var headersToCopy = ['accept-encoding', 'accept-language', 'authorization', 'host', 'connection'];

function pushAssets(connect, req, res, requestAssets, pageAssets) {
  Object.keys(pageAssets).forEach(function (assetRoute) {
    var asset = pageAssets[assetRoute];
    var newHeaders = {
      referrer: req.url
    };
    newHeaders[_constants2.default.PUSH_REQUEST_HEADER] = _constants2.default.PUSH_REQUEST_VALUE;

    // hash key
    var pushKey = asset.key && asset.key !== '$' && asset.key || _crypto2.default.createHash('md5').update(assetRoute).digest("hex");

    var doc = requestAssets[pushKey];
    if (doc) {
      if (doc.noPush) return; // push-disabled by clients request (typically due to cache-control)

      // if doc found in request, supply child-request the proper headers
      // pull in caching headers
      if (doc.etag) newHeaders['if-none-match'] = doc.etag;
      if (doc.lastModified) newHeaders['if-modified-since'] = doc.lastModified;
    }
    // merge request headers into child request headers (for whitelisted headers only)
    newHeaders = (0, _copyHeaders2.default)(headersToCopy, req.headers, newHeaders);

    // pull over minimum props
    var pushReq = {
      method: 'GET',
      url: assetRoute,
      originalUrl: req.originalUrl,
      headers: newHeaders
    };
    var pushRes = res.push(assetRoute);

    // response must include the push key
    pushRes.setHeader(_constants2.default.PUSH_RESPONSE_KEY_HEADER, pushKey);
    // flow the push request through the full connect pipeline
    connect.handle(pushReq, pushRes, function () {});
  });
}