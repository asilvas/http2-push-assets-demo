"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
function copyHeaders(headersToCopy, fromHeaders, newHeaders) {
  newHeaders = newHeaders || {};

  headersToCopy.forEach(function (headerName) {
    var header = fromHeaders[headerName];
    if (header) {
      newHeaders[headerName] = header;
    }
  });

  return newHeaders;
}

exports.default = copyHeaders;