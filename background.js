'use strict';

const contextMenuId = 'toggleAudioCapturing';
const enableAudioCapturing = 'Capture audio';
const disableAudioCapturing = 'Disable audio capturing';

// Setup when extension is installed
chrome.runtime.onInstalled.addListener(function(details) {
  // Prepare storage when extension is installed
  chrome.storage.sync.set({capturingAudio: false}, function() {
    console.log('Not capturing audio.');
  });

  // Prepare context menu
  createContextMenuItem();

  // Open welcome page on first install
  if (details.reason.search(/install/g) === -1) {
    return
  }
  chrome.tabs.create({
    url: chrome.extension.getURL("setup.html"),
    active: true
  })
});

// Listen to context menu clicks
chrome.contextMenus.onClicked.addListener(function(data, tab) {
  console.log('Context menu action triggered for item "' + data.menuItemId + '" with current tab "' + tab.title + '"');

  chrome.storage.sync.get('capturingAudio', function(data) {
    let shouldCapture = !data.capturingAudio;

    console.log('Change capturing state from ' + data.capturingAudio + ' to ' + shouldCapture);

    chrome.storage.sync.set({capturingAudio: shouldCapture}, function() {
      updateContextMenuItem(shouldCapture);
    });
  });
});

// Initially create the context menu item
function createContextMenuItem() {
  chrome.contextMenus.removeAll();
  chrome.contextMenus.create({
    title: enableAudioCapturing,
    id: contextMenuId,
    contexts: ["browser_action"]
  });
}

// Update the context menu item
function updateContextMenuItem(capture) {
  let label = capture ? disableAudioCapturing : enableAudioCapturing;
  chrome.contextMenus.update('toggleAudioCapturing', {
    title: label,
  });
}
