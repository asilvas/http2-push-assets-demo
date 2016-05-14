filesLoaded++;
document.getElementById('loadTime').innerText = Math.round((filesLoaded / filesToLoad) * 100) + '%';
window.parent.postMessage(JSON.stringify({
  msgType: 'loadProgress',
  loadTime: new Date().getTime() - window.performance.timing.navigationStart,
  filesLoaded: filesLoaded,
  filesToLoad: filesToLoad
}), '*');

window.onload = function() {
  var timing = window.performance.timing;
  var loadTime = (timing.domComplete - timing.navigationStart);
  document.getElementById('loadTime').innerText = loadTime + 'ms';
  
  window.parent.postMessage(JSON.stringify({
    msgType: 'loadComplete',
    loadTime: loadTime
  }), '*');
};
