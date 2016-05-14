'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
function isContentTypeUtf8(contenType) {
  // TODO: in the future make this configurable
  return (/\/javascript|text\/|utf\-8|xml/i.test(contenType || '')
  );
}

exports.default = isContentTypeUtf8;