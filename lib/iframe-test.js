var fs = require('fs');
var path = require('path');
var urlParse = require('url').parse;
var htmlparser = require('htmlparser2');
var extend = require('extend');
var async = require('async');

var iframeTestHtml = fs.readFileSync(path.resolve(__dirname, './static/demo/iframe-test.html'), 'utf8');

function iframeTest(req, res) {
  console.log('iframeTest, params:', req.url, req.query);
  var delayMs = req.query.delay || 500;
  var delayMinMs = parseInt(delayMs / 2);
  var delayMaxMs = parseInt(delayMs) + delayMinMs;
  var filesToLoad = req.query.filesToLoad || 10;
  var enabled = req.query.enabled || 'false';
  
  var rand = Math.round(Math.random() * 0xffff);
  
  var scripts = [
    '    <script src="/demo/iframe-test.js?delay=' + delayMinMs + '&enabled=' + enabled + '&r=' + rand + '" data-push-asset="$"></script>'
  ];
  // file the rest with dumb progress scripts
  for (var i = 1; i < filesToLoad; i++) {
    scripts.push('    <script src="/demo/iframe-test-progress.js?delay=' + (i % 2 === 0 ? delayMinMs : delayMaxMs) + '&enabled=' + enabled + '&r=' + rand + '&i=' + i + '" data-push-asset="$"></script>');
  }
  
  // quick and dirty. who needs templating when you have garbage string replacement?
  res.setHeader('Content-Type', 'text/html');
  res.end(iframeTestHtml.replace(/\{scripts\}/, scripts.join('\n')).replace(/\{filesToLoad\}/, filesToLoad));
}

module.exports = iframeTest;

