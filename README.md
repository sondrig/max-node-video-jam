# Spread the video jam

You might have your pals over for some instrument foolin'

You might all have laughed about some videos on youtube, have some vacation footage, movies, TV shows you'd think would be good accompaniment to your tunes.

Record your jam with video, unexpectedly

[![](http://img.youtube.com/vi/51r0sM-kLA0/0.jpg)](http://www.youtube.com/watch?v=51r0sM-kLA0)

[![](http://img.youtube.com/vi/Q76-CJuyCJY/0.jpg)](http://www.youtube.com/watch?v=Q76-CJuyCJY?t=223)


------------

You need:

Route the audio interface through [Logic](http://www.apple.com/uk/logic-pro/) to [SoundFlower](https://github.com/mattingalls/Soundflower) 64ch is good.

The MaxMsp patch supports channels 1-8.

Run a MaxMsp patch that will listen over OSC for videos to play.


## Prereqs

MacOS instructions only.

[MaxMSP](https://cycling74.com/downloads/) there is a free trial. You can’t save, but you can configure.

- ffmpeg `brew install ffmpeg`
- node `brew install node`

## How to run

- `cd node`
- `npm i`

##### You can download youtube playlists by:

- `cd node`
- `node playlist_downloader.js -p <playlistId>`

The videos will be downloaded to _rawVideos_. You can also just copy video files you want to use in to _rawVideos_.

##### Segment the videos into small files

-	`cd node`
-	`node segment_videos.js` //options are available inside the file

Once this is done copy the video files into the folder 0-5 ![](http://i.imgur.com/u9iAiDW.png)


###### Start the OSC sender 

-	`cd node`
-	`node play_videos.js` 












