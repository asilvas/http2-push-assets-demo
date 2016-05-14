var activeSeries;
var activeCallback;
var activeMeta;
var http1progress = [];
var http2progress = [];
var http2pushProgress = [];

(function() {
  window.addEventListener('message', onMessage, false);
  
  performTest('HTTP 1.1', 'http://localhost:1120/demo/iframe-test.html?enabled=false&delay=200&filesToLoad=20', http1progress, function() {
    performTest('HTTP/2 + TLS', 'https://localhost:1121/demo/iframe-test.html?enabled=false&delay=200&filesToLoad=20', http2progress, function() {
      performTest('HTTP/2 + TLS + Server Push', 'https://localhost:1121/demo/iframe-test.html?enabled=true&delay=200&filesToLoad=20', http2pushProgress, function() {
        // done
      });
    });
  });
})();

function api(method, url, obj, cb) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (xhttp.readyState == 4 && xhttp.status == 200) {
      cb(null, JSON.parse(xhttp.responseText));
    } // todo: handle error
  };
  xhttp.open(method || 'GET', url, true);
  xhttp.overrideMimeType('application/json');
  xhttp.send(obj && JSON.stringify(obj));
}

function benchmarkWebsite() {
  var url = document.getElementById('url').value;
  console.log('benchmarkWebsite', url);
  
  document.getElementById('go').setAttribute('disabled', 'true');
  api('POST', '/api/benchmarkWebsite', { url: url }, function(err, res) {
    document.getElementById('go').removeAttribute('disabled');
    console.log('response:', res);
  });
}

function onMessage(event) {
  // don't care about origin in our demo
  try {
    var obj = JSON.parse(event.data);
    
    if (obj.msgType === 'loadProgress') {
      onProgress(obj);
    }
  } catch (ex) {
    // ignore
  }
}

function onProgress(progress) {
  activeSeries.push({ meta: activeMeta, value: progress.loadTime });
  
  var idx = 1;
  var chart = new Chartist.Line('#chartMain', {
    labels: http1progress.map(function(val) { return idx++; }),
    series: [
      http1progress,
      http2progress,
      http2pushProgress
    ]
  },
  {
    chartPadding: {
      top: 20,
      right: 0,
      bottom: 30,
      left: 10
    },
    // Remove this configuration to see that chart rendered with cardinal spline interpolation
    // Sometimes, on large jumps in data values, it's better to use simple smoothing.
    /*lineSmooth: Chartist.Interpolation.simple({
      divisor: 2
    }),*/
    plugins: [
      Chartist.plugins.tooltip(),
      Chartist.plugins.ctAxisTitle({
        axisX: {
          axisTitle: 'File Loaded',
          axisClass: 'ct-axis-title',
          offset: {
            x: 0,
            y: 50
          },
          textAnchor: 'middle'
        },
        axisY: {
          axisTitle: 'Time (ms)',
          axisClass: 'ct-axis-title',
          offset: {
            x: 0,
            y: 0
          },
          textAnchor: 'middle',
          flipTitle: false
        }
      })
    ],
    fullWidth: false,
    low: 0
  });
  
  if (progress.filesLoaded === progress.filesToLoad) {
    activeCallback();
  }
}

function performTest(tooltip, url, series, cb) {
  activeMeta = tooltip;
  activeSeries = series;
  activeCallback = cb;

  var iframe = document.createElement('iframe');
  document.getElementById('iframeTests').appendChild(iframe);
  iframe.src = url;
}
