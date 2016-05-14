filesLoaded++;
document.getElementById('loadTime').innerText = Math.round((filesLoaded / filesToLoad) * 100) + '%';
window.parent.postMessage(JSON.stringify({
  msgType: 'loadProgress',
  loadTime: new Date().getTime() - window.performance.timing.navigationStart,
  filesLoaded: filesLoaded,
  filesToLoad: filesToLoad
}), '*');
