require('shelljs/global');

var fs = require('fs-extra');
var path = require('path');
var Q = require('bluebird');
var _ = require('lodash');
var rimraf = require('rimraf');
var readDir = require('readdir');
var nodeExec = Q.promisify(require('child_process').exec);
var S = require('string');
var argv = require('yargs').argv;

var SEGMENT_MIN = 25;
var SEGMENT_MAX = 10;

if (argv.segMin) {
  SEGMENT_MIN = argv.segMin;
}
if (argv.segMax) {
  SEGMENT_MIN = argv.segMax;
}

var _convertedCount = 0;

var _moviesTimes = [];

var INPUT = path.join(__dirname, '../','rawVideos');
var OUTPUT = path.join(__dirname, '../','segmentedVideos');


function init() {
  fs.mkdirSync(OUTPUT);
  var files = readDir.readSync(INPUT, ['**.mp4', "**.mov", "**.AVI", "**.avi"], readDir.ABSOLUTE_PATHS);
  renameRaw(files);
  var renamedFiles = readDir.readSync(INPUT, ['**.mp4', "**.mov", "**.AVI", "**.avi"], readDir.ABSOLUTE_PATHS);
  createFolders(renamedFiles);
  var rawMoviePaths = getVideos(renamedFiles);
  segmentVideos(rawMoviePaths);
}

function createFolders(files) {
  var dirs = getFolders(files);
  console.log(dirs);
  _.each(dirs, (n) => {
    var d = path.join(OUTPUT, n);
    fs.mkdirSync(d);
  });
  return dirs;
}

function segmentVideos(files) {
  var _moviesTimes = [];
  Q.map(files, function(o) {
    return getDur(o.path);
  }, {
    concurrency: 1
  }).then(function(all) {
    _.each(all, function(t) {
      _moviesTimes.push([]);
      var _t = t;
      while (_t > SEGMENT_MAX) {
        var _r = Math.floor(Math.random() * SEGMENT_MIN + SEGMENT_MAX);
        _t -= _r;
        _t = Math.max(_t, 0);
        _moviesTimes[_moviesTimes.length - 1].push([_t, _r]);
      }
    });
    _.each(_moviesTimes,(obj, i)=>{
      shellRip(obj, files[i].path);
    });
  //   var mCount = -1;
  //   Q.map(_moviesTimes, function(obj) {
  //     mCount++;
  //     return _ripMovie(obj, files[mCount].path);
  //   }, {
  //     concurrency: 1
  //   }).then(function(all) {
  //     console.log("ALL DONE");
  //     cleanUp();
  //   });
  });
}

function shellRip(seg, p){
  var index = 0;
  _.each(seg, (o)=>{
    var parsed = path.parse(p);
    var name = parsed.name + _convertedCount + '.mp4';
    var f = path.parse(p).dir;
    f = f[f.length - 1];
    var out = path.join(OUTPUT, f, name);
    var cmd = "ffmpeg -ss " + o[0] + " -i " + p + " -y -t " + o[1] + " -c:v libx264 -c:a libmp3lame -movflags +faststart -pix_fmt yuv420p -profile:v high -level 4.1 -maxrate 2000k -crf 28 -vf \"scale=-1:360\" " + out;
    console.log(cmd);
    index++;
    _convertedCount++;
    exec(cmd);
  });
}


function cleanUp(){
  var renamedFiles = readDir.readSync(OUTPUT, ['**.mp4'], readDir.ABSOLUTE_PATHS);
  _.each(renamedFiles,(p)=>{
    var s = fs.statSync(p);
    if(s.size < 2000){
      fs.unlinkSync(p);
    }
  });
}


function getDur(p) {
  var cmd = 'ffprobe -v quiet -of json -show_format  -i ' + p;
  return nodeExec(cmd).then(function(o) {
    var parse = JSON.parse(o);
    return Math.floor(parse.format.duration);
  });
}

function _ripMovie(seg, p) {
  var index = 0;
  return Q.map(seg, function(o) {
    var parsed = path.parse(p);
    var name = parsed.name + _convertedCount + '.mp4';
    var f = path.parse(p).dir;
    f = f[f.length - 1];
    var out = path.join(OUTPUT, f, name);
    var cmd = "ffmpeg -ss " + o[0] + " -i " + p + " -y -t " + o[1] + " -c:v libx264 -c:a libmp3lame -movflags +faststart -pix_fmt yuv420p -profile:v high -level 4.1 -maxrate 2000k -crf 28 -vf \"scale=-1:360\" " + out;
    console.log(cmd);
    index++;
    _convertedCount++;
    return nodeExec(cmd);
  }, {
    concurrency: 1
  });
}



//********************
//
//********************

function renameRaw(files) {
  _.each(files, (p) => {
    var s = S(p).collapseWhitespace().s;
    s = s.replace(/ /g, '');
    s = S(s).strip(')', '(', "'").s;
    s = s.replace(/[\u0250-\ue007]/g, '');
    fs.renameSync(p, s);
  });
}


function getFolders(files) {
  var folders = [];
  var activeDir;
  _.each(files, (p) => {
    var f = path.parse(p).dir;
    f = f[f.length - 1];
    if (folders.indexOf(f) === -1) {
      folders.push(f);
    }
  });
  return folders;
}

function getVideos(renamedFiles) {
  var v = [];
  _.each(renamedFiles, (p) => {
    v.push({
      path: p
    });
  });

  return v;
}


rimraf(OUTPUT, init);