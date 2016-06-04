var http = require('http');
var http2 = require('http2');
var connect = require('connect');
var fs = require('fs');
var path = require('path');
var connectStatic = require('connect-static');
var lib = require('http2-push-assets');
var url = require('url');
var argv = require('minimist')(process.argv);

// express+http2 hack?!
//express.request.__proto__ = http2.IncomingMessage.prototype;
//express.response.__proto__ = http2.ServerResponse.prototype;

var app = connect();
var fixedHandler = lib.http.connect(app, {
  forcePush: true, // for demo purposes only, to force push on non-compatible browsers
  fixed: {
    manifests: {
      '/index.html.json': {
        path: path.resolve(__dirname, './static/index.html.json'),
        routes: [
          '/'
        ]
      },
      '/demo/index.html.json': {
        path: path.resolve(__dirname, './static/demo/index.html.json'),
        routes: [
          '/demo/'
        ]
      }
    }
  }
});
var dynamicHandler = lib.http.connect(app, {
  forcePush: true, // for demo purposes only, to force push on non-compatible browsers
  dynamic: {
    pushAttribute: 'data-push-asset', // this
    includeTags: [ 'script', 'link[rel=stylesheet]', 'link[type=text/css]', 'img', 'image' ] // or that
  }
});

function fakeDelayHandler() {
  return function(req, res, next) {
    var delayMs = parseInt(getQSParam(req, 'delay', '0'));
    // ignore delay if the request is a server-push
    if (!delayMs) return void next();

    if (req.isPushAsset) {
      delayMs = Math.round(delayMs / 2);
    }

    setTimeout(next, delayMs);
  }
}

function toggleFixedHandler() {
  return function(req, res, next) {
    if (getQSParam(req, 'enabled', 'true') === 'false' || getQSParam(req, 'dynamic', 'true') === 'true') {
      return void next();
    }

    fixedHandler(req, res, next);
  }
}

function toggleDynamicHandler() {
  return function(req, res, next) {
    if (getQSParam(req, 'enabled', 'true') === 'false' || getQSParam(req, 'dynamic', 'true') !== 'true') {
      return void next();
    }
    dynamicHandler(req, res, next);
  }
}

function getQSParam(req, name, defaultValue) {
  if (name in req.query) {
    return req.query[name];
  }
  if (!req.headers.referer) return defaultValue;
  if (name in req.query) {
    return req.query[name];
  }
  return defaultValue;
}

app.use(function(req, res, next) {
  var parsedUrl = url.parse(req.url, true);
  req.query = parsedUrl.query;
  req.url = parsedUrl.pathname;
  
  next();
});

// map root to manifest only
app.use(toggleFixedHandler());
app.use(toggleDynamicHandler());

// setup handlers
app.use(fakeDelayHandler());

//app.get('/demo/iframe-test.html/:enabled?/:delayMs?/:filesToLoad?', require('./iframe-test'));

app.use(function(req, res, next) {
  if (/^\/demo\/iframe\-test\.html/.test(req.url)) {
    require('./iframe-test')(req, res);
  } else next();
});

// connect-static is an async middleware
connectStatic({
  dir: path.resolve(__dirname, './static'),
  aliases: [
    ['/', '/index.html'],
  ],
  followSymlinks: true,
  cacheControlHeader: 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0'
}, function(err, middleware) {
  app.use(middleware);
  http.createServer(app).listen(process.env.port || 1120);
  http2.createServer({
    cert: fs.readFileSync(path.resolve(__dirname, './ssl/public.crt')),
    key: fs.readFileSync(path.resolve(__dirname, './ssl/private.key'))
  }, app).listen(1121);

  console.log('Connect to: http://localhost:1120');
});

app.use(require('body-parser').json());
app.use(require('body-parser').urlencoded({ }));

//app.post('/api/benchmarkWebsite', require('./benchmark-website'));
