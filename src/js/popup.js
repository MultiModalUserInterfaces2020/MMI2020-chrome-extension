'use strict';

let button = document.getElementById('recordButton');

button.addEventListener('click', function () {
  chrome.runtime.sendMessage({ action: 'START_CAPTURING_AUDIO' });
  button.disabled = true;
  window.close();
});

// Listen to stop recording event
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'STOP_CAPTURING_AUDIO') {
    button.disabled = false;
  }
});

// Restore state when popup is opened
chrome.storage.local.get("capturingAudio",function(res) {
  button.disabled = res.capturingAudio || false;
});
