'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _constants = require('../constants');

var _constants2 = _interopRequireDefault(_constants);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function parseHeader(headerStr) {
  if (typeof headerStr !== 'string') return; // undefined
  var docs = {};

  var split = headerStr.split(';');
  split.forEach(function (d) {
    d = d.trim();
    if (d === '*') {
      return; // reserved
    }
    var indexOfEqual = d.indexOf('=');
    if (indexOfEqual < 0) {
      return; // invalid key/value
    }
    var key = d.substr(0, indexOfEqual).trim();
    var val = d.substr(indexOfEqual + 1).trim();

    var noPush = val.toLowerCase() === _constants2.default.REQUEST_HEADER_NOPUSH;
    var etag = getETag(val);
    var lastModified = getLastModified(val);

    if (!noPush && !etag && !lastModified) {
      return; // invalid headers
    }

    var doc = { key: key, noPush: noPush };

    if (etag) {
      doc.etag = etag;
    }

    if (lastModified) {
      doc.lastModified = lastModified;
    }

    docs[doc.key] = doc;
  });

  return docs;
} /* FORMAT:
  
    {HEADER_NAME}: {URL1}=[etag({URL1_ETAG}),][last-modified({URL1_LAST_MODIFIED})]; {URL2}=[etag({URL2_ETAG}),][last-modified({URL2_LAST_MODIFIED})]
  
    OR if unknown dependencies, requestor should send:
    
    {HEADER_NAME}: *
  
  */

function getETag(header) {
  var exec = /etag\((.*?)\)/i.exec(header);
  return exec && exec.length === 2 ? exec[1] : null;
}

function getLastModified(header) {
  var exec = /last-modified\((.*?)\)/i.exec(header);
  return exec && exec.length === 2 ? exec[1] : null;
}

exports.default = parseHeader;