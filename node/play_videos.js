var fs = require('fs');
var path = require('path');
var Q = require('bluebird');
var _ = require('lodash');
var readDir = require('readdir');
var exec = Q.promisify(require('child_process').exec);
var argv = require('yargs').argv;
var colors = require('colors');

var OUTPUT = path.join(__dirname, '_converted');
var _updateCounter = 0;
var _colors = ['green', 'yellow', 'cyan', 'magenta', 'white', 'red', 'blue'];


var hosturl = "0.0.0.0";
var oscport = 32000;

// OSC Senderを立ち上げる
var oscsender = require('omgosc').UdpSender;
var sender = new oscsender(hosturl, oscport);

function getFiles(p) {
  return readDir.readSync(OUTPUT, ['**.mp4'], readDir.ABSOLUTE_PATHS);
}

function videosByFolder(files) {
  var folders = [];
  var activeDir;
  var previousF;
  _.each(files, (p) => {
    var f = path.parse(p).dir;
    f = f[f.length - 1];
    if (previousF !== f) {
      activeDir = [p];
      folders.push(activeDir);
    } else {
      activeDir.push(p);
    }
    previousF = f;
  });
  return folders;
}


var videoFiles = videosByFolder(getFiles(OUTPUT));

function getDur(p) {
  var cmd = 'ffprobe -v quiet -of json -show_format  -i ' + p;
  console.log(cmd);
  return exec(cmd).then(function(o) {
    var parse = JSON.parse(o);
    return Math.floor(parse.format.duration);
  });
}

function getDurations(videoG) {
  return Q.map(videoG, (g) => {
    return Q.map(g, (p) => {
      return getDur(p);
    }, {
      concurrency: 1
    }).then((durations) => {
      return durations;
      console.log(durations);
    });
  }, {
    concurrency: 1
  }).then((durations) => {
    var final = [];
    _.each(videoG, (g, i) => {
      var durs = durations[i];
      var merge = _.zip(g, durs);
      final.push({
        currentIndex: 0,
        secondCounter: 0,
        videos: merge
      });
    });
    return final;
  });
}


function play(videoFiles) {
  setInterval(() => {
    _updateCounter++;
    _.each(videoFiles, (g, i) => {
      if (_updateCounter % 100 === 0) {
        g.secondCounter++;
      }
      var activeVideo = g.videos[g.currentIndex];
      //duration
      if (g.secondCounter > activeVideo[1]) {
        if (!argv.notRandom) {
          g.currentIndex = Math.floor(Math.random() * (g.videos.length - 1));
        } else {
          g.currentIndex++;
          if (g.currentIndex > g.videos.length - 1) {
            g.currentIndex = 0;
          }
        }
        g.secondCounter = 0;
        sendVideo(activeVideo[0], i);
      }
    });
  }, 10);
}

function sendVideo(p, route) {
  var r = 'videos' + route;
  sender.send(r, 's', [p]);
  var c = route % (_colors.length-1)
  console.log(colors[_colors[c]](r, p));
}

getDurations(videoFiles)
  .then((videosDurations) => {
    play(videosDurations);
  });
return;



var forgroundFiles = getFiles(FOREGROUND);
var backgroundFiles = getFiles(BACKGROUND);
var startTimes1;
var startTimes2;

Q.map(forgroundFiles, function(o) {
  return getDur(o.path);
}, {
  concurrency: 1
}).then(function(all) {
  startTimes1 = all;
  Q.map(backgroundFiles, function(o) {
    return getDur(o.path);
  }, {
    concurrency: 1
  }).then(function(all) {
    startTimes2 = all;
    start();
  });
});




var secondCounter1 = -1;
var secondCounter2 = -1;
var videoIndex1 = -1;
var videoIndex2 = -1;
var counter = 0;

function start() {
  setInterval(function() {
    counter++;
    if (counter % 100 === 0) {
      secondCounter1++;
      secondCounter2++;
    }
    //console.log("starttime1",startTimes1[videoIndex1] )
    if (secondCounter1 > startTimes1[videoIndex1] || videoIndex1 < 0) {
      videoIndex1++;
      secondCounter1 = 0;

      videoIndex1 = Math.floor(Math.random() * (forgroundFiles.length - 1));

      sendVideo1(forgroundFiles[videoIndex1].path);
      //send new video
    }
    //console.log("starttime2",startTimes2[videoIndex2],secondCounter2 )
    if (secondCounter2 > startTimes2[videoIndex2] || videoIndex2 < 0) {
      videoIndex2++;
      secondCounter2 = 0;

      videoIndex2 = Math.floor(Math.random() * (backgroundFiles.length - 1));

      sendVideo2(backgroundFiles[videoIndex2].path);
      //send new video
    }
  }, 10);
}