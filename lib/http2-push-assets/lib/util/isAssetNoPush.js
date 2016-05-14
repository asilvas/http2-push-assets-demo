'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
function isAssetNoPush(file) {
  return (/no\-|must/i.test(file.headers['cache-control'] || 'no-cache') === false
  );
}

exports.default = isAssetNoPush;