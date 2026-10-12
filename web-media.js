window.gooddoVideoSource = function(video, mp4) {
  return video.canPlayType('video/webm; codecs="vp9"') ? mp4.replace(/\.mp4$/, '.webm') : mp4;
};
