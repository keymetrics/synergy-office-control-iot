var fs = require('fs');
var path = require('path');
var http = require('http');
var https = require('https');
var urlParse  = require('url').parse;
var googleTTS = require('google-tts-api');
var exec = require('child_process').exec;
var os = require('os');

function downloadFile (url, dest) {
  return new Promise(function (resolve, reject) {
    var info = urlParse(url);
    var httpClient = info.protocol === 'https:' ? https : http;
    var options = {
      host: info.host,
      path: info.path,
      headers: {
        'user-agent': 'WHAT_EVER'
      }
    };

    httpClient.get(options, function(res) {
      // check status code
      if (res.statusCode !== 200) {
        reject(new Error('request to ' + url + ' failed, status code = ' + res.statusCode + ' (' + res.statusMessage + ')'));
        return;
      }

      var file = fs.createWriteStream(dest);
      file.on('finish', function() {
        // close() is async, call resolve after close completes.
        file.close(resolve);
      });
      file.on('error', function (err) {
        // Delete the file async. (But we don't check the result)
        fs.unlink(dest);
        reject(err);
      });

      res.pipe(file);
    })
      .on('error', function(err) {
        reject(err);
      })
      .end();
  });
}

var tmp_path = path.resolve(os.tmpdir(), 'hello.mp3');
module.exports= function(text, lang, cb) {
  // start
  if (typeof(lang) == 'function') {
    cb = lang;
    lang = 'en';
  }

  googleTTS(text, lang)
    .then(function (url) {
      console.log(url); // https://translate.google.com/translate_tts?...

      var dest = tmp_path // file destination
      console.log('Download to ' + dest + ' ...');

      return downloadFile(url, tmp_path);
    })
    .then(function () {
      exec('mpg123 ' + tmp_path);
      cb();
    })
    .catch(function (err) {
      console.error(err.stack);
    });
}
