## Prereq

On MacOS 

- ffmpeg

`brew install ffmpeg --with-fdk-aac --with-ffplay --with-freetype --with-frei0r --with-libass --with-libvo-aacenc --with-libvorbis --with-libvpx --with-opencore-amr --with-openjpeg --with-opus --with-rtmpdump --with-schroedinger --with-speex --with-theora --with-tools`

- node



	`brew install node`

### PLAYLIST_DOWNLOADER

Downloads a youtube playlist into `../rawVideos`

`node playlist_downloader -p <playlistId>`


### SEGMENT VIDEOS

Split the videos inside `rawVideos` into chunks. Output into `../segmentedVideos`

`node segment_videos --segMin 5 --segMax 30`

Or without options for defaults.

Make sure you copy all the files out of `../segmentedVideos` after because it clears it everytime.

### PLAY VIDEOS

Send the videos inside `_converted` over OSC.

Requires that they be in folders: 0, 1, 2, 3, 4...

Listen on OSC port 32000 for `video0`, `video1`, `video2`...

It gets the duration of each video and when it's finished sends the next one in that folder

`node play_videos --notRandom`

Random is default. notRandom means it will move linearly through a folder.


