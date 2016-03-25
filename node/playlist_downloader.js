var _ = require('lodash');
var Q = require('bluebird');
var request = require('request');
var fs = require('fs');
var path = require('path');
var yargs = require('yargs').argv;
var YT = require('ytdl-core');

var YOUTUBE_KEY = 'AIzaSyCebfDVAnfQw4wocPjNo7Czwndt7z9ArvA';

var OUTPUT = path.join(process.cwd(), '../rawVideos');

var PLAYLIST_ID = yargs.p;
if(!PLAYLIST_ID){
  throw new Error('need playlist id');
  return;
}

var YoutubeScraper = (function() {
  'use strict';

  function _getPlaylistItems() {
    var params = {
      playlistId: PLAYLIST_ID,
      maxResults: 50,
      part: 'snippet',
      key: YOUTUBE_KEY
    };

    var youtubeSearchResults = [];
    var searchCount = 0;

    function _ytRequest(params) {
      var r = request({
        url: 'https://www.googleapis.com/youtube/v3/playlistItems',
        qs: params
      }, function(err, response, body) {
        if (err) {
          console.log('0__getPlaylistItems', err);
          _ytRequest(params);
          return;
        }
        var r = JSON.parse(body);
        searchCount++;
        params['pageToken'] = r['nextPageToken'];
        youtubeSearchResults = youtubeSearchResults.concat(r['items']);
        if (!params['pageToken']) {
          _extractIds(youtubeSearchResults);
        } else {
          _ytRequest(params);
        }
      });

      r.on('error', function(err) {
        console.log('1__getPlaylistItems', err);
        _ytRequest(params);
      });
    }
    _ytRequest(params);
  }

  function _extractIds(results) {
    var ids = [];
    console.log(results);
    _.each(results, function(o) {
      ids.push(o.snippet.resourceId.videoId);
    });
    console.log(ids);
    Q.map(ids, function(id) {
      return _download(id);
    }, {
      concurrency: 1
    });
  }

  function _download(id) {
    return new Q(function(resolve, reject) {
      var url = 'http://www.youtube.com/watch?v=' + id;
      YT.getInfo(url, {}, function(err, info) {
        console.log(info);
        if (!info) {
          resolve();
        } else {
          var f = fs.createWriteStream(path.join(OUTPUT, id + '.mp4'));

          f.on('finish', function() {
            resolve();
          });
          YT('http://www.youtube.com/watch?v=' + id, {
              itag: "18",
              filter: function(format) {
                return format.container === 'mp4';
              }
            })
            .pipe(f);
        }
      });
      /*
       */
    });
  }

  _getPlaylistItems();

})();

module.exports = YoutubeScraper;