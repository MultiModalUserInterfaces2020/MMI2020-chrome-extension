'use strict'

// Setup when extension is installed
chrome.runtime.onInstalled.addListener(function (details) {
  // Prepare storage when extension is installed
  chrome.storage.local.set({ capturingAudio: false }, function () {
    console.log('Not capturing audio.')
  });

  // Open welcome page on first install
  if (details.reason.search(/install/g) === -1) {
    return;
  }
  chrome.tabs.create({
    url: chrome.extension.getURL('setup.html'),
    active: true
  });
})

// Listen to START_CAPTURING_AUDIO event from popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'START_CAPTURING_AUDIO') {
    startCapturingAudio();
  }
})

// Listen to shortcut commands
chrome.commands.onCommand.addListener(function (command) {
  if (command === 'activate-voice-command') {
    startCapturingAudio();
  }
});

function startCapturingAudio () {
  chrome.storage.local.get('capturingAudio', function (res) {
    const capturingAudio = res.capturingAudio || false;
    if (capturingAudio) {
      console.log('Capturing already in progress...');
      return false;
    }

    chrome.storage.local.set({ capturingAudio: true }, function () {
      console.log('Start capturing audio...')
      chrome.browserAction.setBadgeText({ text: 'Rec.' })

      // TODO: Recognize speech command
      // Example: Run example action after 2 sec
      window.setTimeout(function () {
        exampleAction(function() {
          stopCapturingAudio();
        });
      }, 2000)
    });
  });
}

function stopCapturingAudio () {
  chrome.storage.local.set({ capturingAudio: false }, function () {
    chrome.browserAction.setBadgeText({ text: '' });
    console.log('Stop capturing audio...');
    chrome.runtime.sendMessage({ action: 'STOP_CAPTURING_AUDIO' });
  });
}

// Example action: Download the first image on the website
function exampleAction(callback) {
  chrome.tabs.query({active: true}, function (tabs) {
    let tabId = tabs[0].id;

    chrome.tabs.sendMessage(tabId, { action: 'RETURN_FIRST_IMAGE' }, response => {
      const imageURL = chrome.runtime.getURL('get_started48.png');
      const notificationOptions = {
        type: 'basic',
        iconUrl: imageURL,
        title: 'Yeah!',
        message: 'Downloaded the first image on the page'
      };

      if (response) {
        createNotification(notificationOptions);
      } else {
        notificationOptions.title = 'Doh!';
        notificationOptions.message = 'There where no images on the page';
        createNotification(notificationOptions);
      }
    });
  })
  callback();
}

function createNotification(notificationOptions) {
  chrome.storage.sync.get(['enableNotifications'], function(options) {
    if (options.enableNotifications) {
      chrome.notifications.create('', notificationOptions);
    }
  });
}
