var tag = document.createElement('script');
tag.src = "//www.youtube.com/player_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
function onYouTubeIframeAPIReady() {
  $('.youtube-video').inViewAutoplay({
    autohide: 1,
    modestbranding: 1,
    rel: 0,
    quality: 'hd'
  });
}
