'use strict';

var RANDOM = Math.random();
setInterval(function() {
  console.log('XXXXX I AM STILL ALIVE !!!!', RANDOM);
}, 1000);

window.addEventListener('load', function callSetup(evt) {
  window.removeEventListener('load', callSetup);

  console.log('XXXXXX load ', RANDOM);
  CallsHandler.setup();
  CallScreen.init();
  KeypadManager.init(true);
});

// Don't keep an audio channel open when the callscreen is not displayed
document.addEventListener('visibilitychange', function visibilitychanged() {
  if (document.hidden) {
    TonePlayer.trashAudio();
  } else {
    TonePlayer.ensureAudio();
  }
});
