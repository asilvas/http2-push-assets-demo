var activeSeries;
var activeSeriesOverall = [];
var activeCallback;
var activeTooltip;
var activeMeta;
var activeChartId;
var http1progress = [];
var http2progress = [];
var http2pushProgress = [];
var seriesData = [];
var activeIndexOverall;
var resetFnc;
var delays = [50, 100, 200, 400, 600];
var filesToLoad = 15;
var seriesDataByProtocol = []; // [ delays * protocol]
delays.forEach(function() {
  seriesDataByProtocol.push([]);
});
var seriesDataByLatency = []; // [ protocol * delays]
var labelsByProtocol = [];
var labelsByLatency = delays.map(function(delay) { return delay + 'ms'; });

(function() {
  window.addEventListener('message', onMessage, false);

  async.series([
    function(cb) {
      performTest('chartHttp1', 'HTTP 1.1', 'http://localhost:1120/demo/iframe-test.html?enabled=false', cb);
    },
    function(cb) {
      performTest('chartHttp2', 'HTTP/2+TLS', 'https://localhost:1121/demo/iframe-test.html?enabled=false', cb);
    },
    function(cb) {
      performTest('chartHttp2Push', 'HTTP/2+TLS+Push', 'https://localhost:1121/demo/iframe-test.html?enabled=true', cb);
    }
  ], function(err, results) {
    // done
    console.log('labels:', labelsByLatency);
    console.log('series:', seriesDataByLatency);
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
  //activeSeriesOverall[activeIndexOverall] = progress.loadTime;
  seriesDataByProtocol[activeIndexOverall][labelsByProtocol.length - 1] = { meta: activeMeta, value: progress.loadTime };
  seriesDataByLatency[seriesDataByLatency.length - 1][activeIndexOverall] = { meta: activeMeta, value: progress.loadTime };
  
  var idx = 1;
  var chart = new Chartist.Line('#' + activeChartId, {
    labels: seriesData[0].map(function(val) { return idx++; }),
    series: seriesData
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
      Chartist.plugins.tooltip({
        transformTooltipTextFnc: loadTimeToolTip
      }),
      Chartist.plugins.zoom({ onZoom: onZoom }),
      Chartist.plugins.ctAxisTitle({
        axisX: {
          type: Chartist.AutoScaleAxis,
          axisTitle: 'Files Loaded via ' + activeTooltip,
          axisClass: 'ct-axis-title',
          offset: {
            x: 0,
            y: 50
          },
          textAnchor: 'middle'
        },
        axisY: {
          type: Chartist.AutoScaleAxis,
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

  var chart2 = new Chartist.Bar('#chartByProtocol', {
    labels: labelsByProtocol,
    series: seriesDataByProtocol
  },
  {
    //seriesBarDistance: 10,
    //reverseData: true,
    horizontalBars: true,
    axisY: {
      offset: 100
    },
    chartPadding: {
      top: 20,
      right: 0,
      bottom: 20,
      left: 10
    },
    plugins: [
      Chartist.plugins.tooltip({
        transformTooltipTextFnc: loadTimeToolTip
      }),
      Chartist.plugins.ctAxisTitle({
        axisX: {
          type: Chartist.AutoScaleAxis,
          axisTitle: 'Total Load Time (ms)',
          axisClass: 'ct-axis-title',
          offset: {
            x: 0,
            y: 50
          },
          textAnchor: 'middle'
        },
        axisY: {
          type: Chartist.AutoScaleAxis,
          axisTitle: '',
          axisClass: 'ct-axis-title',
          offset: {
            x: 0,
            y: 0
          },
          textAnchor: 'middle',
          flipTitle: false
        }
      })
    ]
  });
  
  var chart3 = new Chartist.Bar('#chartByLatency', {
    labels: labelsByLatency,
    series: seriesDataByLatency
  },
  {
    //seriesBarDistance: 10,
    //reverseData: true,
    horizontalBars: true,
    axisY: {
      offset: 100
    },
    chartPadding: {
      top: 20,
      right: 0,
      bottom: 20,
      left: 10
    },
    plugins: [
      Chartist.plugins.tooltip({
        transformTooltipTextFnc: loadTimeToolTip
      }),
      Chartist.plugins.ctAxisTitle({
        axisX: {
          type: Chartist.AutoScaleAxis,
          axisTitle: 'Total Load Time (ms)',
          axisClass: 'ct-axis-title',
          offset: {
            x: 0,
            y: 50
          },
          textAnchor: 'middle'
        },
        axisY: {
          type: Chartist.AutoScaleAxis,
          axisTitle: 'Avg Response Times (ms)',
          axisClass: 'ct-axis-title',
          offset: {
            x: 0,
            y: 0
          },
          textAnchor: 'middle',
          flipTitle: false
        }
      })
    ]
  });    
    
    activeCallback();
  }
}

function loadTimeToolTip(val) {
  return 'Load Time: ' + val + 'ms';
}

function performTest(chartId, tooltip, url, cb) {
  seriesData = [];
  activeChartId = chartId;
  labelsByProtocol.push(tooltip);
  seriesDataByLatency.push([]);

  var overallIdx = 0;
  var tasks = delays.map(function(delay) {
    return function(cb) {
      (function(idx) {
        console.log('performTest', tooltip, idx, delay);
        performMinorTest(idx, tooltip, url, delay, cb);
      })(overallIdx++);
    };
  });

  async.series(tasks, cb);
}

function performMinorTest(overallIdx, tooltip, url, delay, cb) {
  activeTooltip = tooltip;
  activeMeta = tooltip + ' @ ' + delay + 'ms';
  activeSeries = [];
  seriesData.push(activeSeries);
  activeIndexOverall = overallIdx;
  activeCallback = cb;
  seriesDataByProtocol[overallIdx].push([]);

  var iframe = document.createElement('iframe');
  document.getElementById('iframeTests').appendChild(iframe);
  iframe.src = url + '&delay=' + delay + '&filesToLoad=' + filesToLoad;
}

function onZoom(chart, reset) {
  resetFnc = reset;
}

document.getElementById('chartMainReset').addEventListener('click', function() {
  resetFnc && resetFnc();
});
