'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _htmlparser = require('htmlparser2');

var _htmlparser2 = _interopRequireDefault(_htmlparser);

var _util = require('../util');

var _util2 = _interopRequireDefault(_util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function Http2DependsDynamic(connect, options) {
  options.pushAttribute = options.pushAttribute || 'data-push-asset'; // this
  options.includeTags = options.includeTags || ['script', 'link[rel=stylesheet]', 'link[type=text/css]', 'img', 'image']; // or that

  // todo: optimize tags lookup
  var includeTags = {};
  options.includeTags.forEach(function (t) {
    var split = t.split('[');
    var tagName = split[0].toLowerCase();
    var tag = includeTags[tagName] || { attributes: [] };
    if (split.length > 1) {
      // tag attributes
      split[1].substr(0, split[1].length - 1).split(',').forEach(function (ta) {
        var taSplit = ta.split('=');
        if (taSplit.length === 2) {
          tag.attributes.push({ name: taSplit[0].toLowerCase(), value: taSplit[1].toLowerCase() });
        }
      });
    }
    includeTags[tagName] = tag;
  });

  return function (requestAssets, req, res, next) {
    //console.log('* DYNAMIC HANDLER', req.url);

    var chunks = [];
    var isHtml = false;

    var setHeader = res.setHeader;
    res.setHeader = function (name, val) {
      if (/content\-type/i.test(name) && /html/i.test(val)) {
        isHtml = true;
      }
      setHeader.apply(res, arguments);
    }.bind(res);

    var writeHead = res.writeHead;
    res.writeHead = function () {
      if (arguments.length > 1) {
        var lastArg = arguments[arguments.length - 1];
        if ((typeof lastArg === 'undefined' ? 'undefined' : _typeof(lastArg)) === 'object') {
          var ct = lastArg['Content-Type'];
          if (ct && /html/i.test(ct)) {
            isHtml = true;
          }
        }
      }
      writeHead.apply(res, arguments);
    }.bind(res);

    var end = res.end;
    res.end = function (chunk) {
      if (chunk && isHtml) chunks.push(Buffer.isBuffer(chunk) ? chunk.toString() : chunk);

      if (isHtml && chunks.length > 0) {
        var html = chunks.join('');
        var pushAssets = {};

        var parser = new _htmlparser2.default.Parser({
          onopentag: function onopentag(name, attr) {
            var pushAttribute = attr[options.pushAttribute];
            var match = pushAttribute !== undefined;
            if (!match) {
              // check tag
              var tag = includeTags[name];
              if (tag) {
                // verify attribute match, if any provided
                if (tag.attributes.length === 0) {
                  match = true; // any attributes suffice
                } else {
                    // check against attributes
                    match = tag.attributes.filter(function (ta) {
                      var attrMatch = attr[ta.name];
                      return attrMatch && attrMatch === ta.value;
                    }).length > 0; // one or more matches will suffice (either OR)
                  }
              }
            }

            if (match) {
              // sufficient url detection for demo only
              var assetUrl = attr['xlink:href'] /* svg */ || attr.src || attr.href;
              if (typeof assetUrl === 'string') {
                var asset = {
                  // key is equal to url unless the matching attribute contains a valid key
                  key: pushAttribute && pushAttribute !== '$' ? pushAttribute : '$'
                };
                console.log('pushAsset:', asset);
                pushAssets[assetUrl] = asset;
              }
            }
          }
        }, { decodeEntities: false, lowerCaseTags: true, lowerCaseAttributeNames: true });
        parser.write(html);
        parser.end();

        // push available assets
        _util2.default.pushAssets(connect, req, res, requestAssets, pushAssets);
      }

      end.apply(res, arguments);
    }.bind(res);

    var write = res.write;
    res.write = function (chunk) {
      if (isHtml) chunks.push(Buffer.isBuffer(chunk) ? chunk.toString() : chunk); // only if html
      write.apply(res, arguments);
    }.bind(res);

    // continue
    next();
  };
}

exports.default = Http2DependsDynamic;