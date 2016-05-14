var argv = require('minimist')(process.argv);
var prettyjson = require('prettyjson');
var benchmark = require('./benchmark');

var url = argv.url;

benchmark(url, argv, function(err, results) {
  if (err) {
    console.error('request.err:', err.stack || err);
  } else {
    var options = {
      noColor: false
    };
    
    // cleanup stuff unrelated to stats
    results.files.forEach(function(file) {
      delete file.body;
    });
    
    console.log(prettyjson.render(results, options));
  }
  
  // bug?! should not need to force exit, but agent socket appears to be left open (by design?!)
  process.exit();
  
});
