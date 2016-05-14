var lib = require('http2-push-assets');
var fs = require('fs');
var path = require('path');
var urlParse = require('url').parse;
var htmlparser = require('htmlparser2');
var extend = require('extend');
var async = require('async');

function benchmark(url, options, cb) {
  if (!url) {
    throw new Error('--url {url} required');
  }
    
  var requestOptions = urlParse(url);
  console.log('request.url:', url);
  //console.log('request.requestOptions:', requestOptions);

  // Optionally verify self-signed certificates.
  if (requestOptions.hostname == 'localhost') {
    requestOptions.key = fs.readFileSync(path.join(__dirname, './ssl/private.key'));
    requestOptions.ca = fs.readFileSync(path.join(__dirname, './ssl/public.crt'));
  }

  async.auto({
    firstRun: function(cb) {
      console.log('!!! Dry run, no caching...');
      runDownload(requestOptions, options, [], cb);
    },
    cacheRun: ['firstRun', function(results, cb) {
      console.log('!!! Cached run, push disabled for assets with `Cache-Control`...');
      runDownload(requestOptions, options, results.firstRun.files, cb);
    }],
    modifiedCheck: ['cacheRun', function(results, cb) {
      console.log('!!! Is Modified (304) run...');
      var files = results.cacheRun.files.map(function(file) {
        delete file.headers['cache-control'];
        return file;
      });
      runDownload(requestOptions, options, files, cb);
    }]
  }, function(err, results) {
    if (err) console.error(err);
    if (results) {
      results.files = results.firstRun.files;
      delete results.firstRun.files;
      delete results.cacheRun.files;
      delete results.modifiedCheck.files;
    }
    
    cb(err, results);
  });
}

module.exports = benchmark;

function runDownload(requestOptions, options, cachedFiles, cb) {
  var results = {
    start: Date.now()
  };
  
  requestOptions.files = cachedFiles;
  lib.http.request(requestOptions, function(err, res, body, files) {
    if (err) {
      return void cb(err);
    }

    results.htmlResponse = {
      statusCode: res && res.statusCode,
      responseTimeMs: Date.now() - results.start,
      fileCount: files.length,
      cacheCount: files.filter(function(f) { return f.statusCode === 304; }).length
    };
    
    //console.log('results.htmlResponse', results.htmlResponse);
    
    var assets = [];
    
    // HTML Parser should suffice for our examples. No need for headless browser.
    var parser = new htmlparser.Parser({
      onopentag: function(name, attr) {
        // sufficient url detection for demo only
        var assetUrl = attr['xlink:href'] /* svg */ || attr.src || attr.href;
        if (typeof assetUrl === 'string') {
          if (files.filter(function(file) { return urlParse(file.url).path === assetUrl; }).length === 0) {
            // not found
            //console.log('Also requesting in parallel:', assetUrl);
            assets.push(assetUrl);
          }
        }
      }
    }, { decodeEntities: false });
    parser.write(body);
    parser.end();

    var assetTasks = assets.map(function(assetUrl) {
      return function(cb) {
        // child requests can leverage http2 as well, even if server-push isn't enabled for the given asset
        if (/^\/\//i.test(assetUrl)) { // schema-relative path 
          assetUrl = 'https:' + requestOptions.host + assetUrl;
        } else if (!/^http/i.test(assetUrl)) { // relative path
          assetUrl = 'https://' + requestOptions.host + assetUrl;
        }
        var childOptions = urlParse(assetUrl);
        if (childOptions.hostname == 'localhost') {
          childOptions.key = requestOptions.key;
          childOptions.ca = requestOptions.ca;
        }
        childOptions.headers = {};
        
        var cachedFile = (cachedFiles || []).filter(function(file) { return file.url === assetUrl; })[0];
        if (cachedFile) {
          // pass along cache headers
          if (cachedFile.headers['etag']) childOptions.headers['if-none-match'] = cachedFile.headers['etag'];
          if (cachedFile.headers['last-modified']) childOptions.headers['if-modified-since'] = cachedFile.headers['last-modified'];
        }
        
        lib.http.request(childOptions, function(err, res, body) {
          if (err) {
            return void cb(err);
          }
          
          // ignore files for now -- shouldn't be necessary for child assets at this time
          
          file = {
            url: assetUrl,
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          };
          
          files.push(file);
          
          cb(null, file);
        });
      };
    });

    async.parallelLimit(assetTasks, parseInt(options.concurrentDownloads || 6) /* typical browser concurrency limit */, function(err) {
      if (err) {
        return void cb(err);
      }

      results.files = files;
      results.stats = {
        totalTimeMs: Date.now() - results.start,
        fileCount: files.length,
        bytesTransferred: files.reduce(function(total, file) {
          return total + calcBytesTransferred(file.body, file.headers, file.noPush);
        }, calcBytesTransferred(body, res.headers)),
        cacheCount: files.filter(function(f) { return f.noPush || f.statusCode === 304; }).length
      };

      //console.log('results.stats', results.stats);

      cb(null, results);
    });
  });
}

function calcBytesTransferred(body, headers, noPush) {
  if (noPush) return 0;

  var bodyLength = body ?
    (Buffer.isBuffer(body) && body.length)
    ||
    Buffer.byteLength(body)
    : 0 // no body
  var headersLength = JSON.stringify(headers).length; // approx is sufficient
  
  return bodyLength + headersLength;
}
