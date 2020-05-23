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
      startRecordingMousePosition();
      console.log('Start capturing audio...')
      chrome.browserAction.setBadgeText({ text: 'Rec.' })

      VoiceCommandRecognizer.startRecognizing(function (validCommand, result) {
        stopCapturingAudio();
        stopRecordingMousePosition();

        if (validCommand) {
          // Run the desired command
          switch (result.transcript) {
            case 'save' :
            case 'download': downloadAction(); break;

            case 'copy': copyAction(); break;

            case 'example': exampleAction(); break;
          }
        } else {
          createNotification('Command not recognized', '«' + result.transcript + '» is not a valid command');
        }
      });
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
function exampleAction() {
  chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    let tabId = tabs[0].id;

    chrome.tabs.sendMessage(tabId, { action: 'RETURN_FIRST_IMAGE' }, response => {
      if (response) {
        createNotification('Success', 'Downloaded the first image on the page');
      } else {
        createNotification('Sorry', 'There where no images on the page');
      }
    });
  })
}

// Download action: Download the image at the mouse position
function downloadAction() {
  chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    let tabId = tabs[0].id;

    chrome.tabs.sendMessage(tabId, { action: 'DOWNLOAD_IMAGE' }, response => {
      if (response) {
        createNotification('Success', 'Downloaded the desired image');
      } else {
        createNotification('Sorry', 'This image could not be downloaded');
      }
    });
  })
}

// Copy action: Copy the image at the mouse position
function copyAction() {
  chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    let tabId = tabs[0].id;

    chrome.tabs.sendMessage(tabId, { action: 'COPY_IMAGE' }, response => {
      if (response) {
        createNotification('Success', 'Copied the desired image to clipboard');
      } else {
        createNotification('Sorry', 'This image could not be copied to clipboard');
      }
    });
  })
}

// Notify action: notify content script to start recording eye position
function startRecordingMousePosition() {
  chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    let tabId = tabs[0].id;

    chrome.tabs.sendMessage(tabId, { action: 'START_RECORDING' });
  })
}

// Notify action: notify content script to stop recording eye position
function stopRecordingMousePosition() {
  chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    let tabId = tabs[0].id;

    chrome.tabs.sendMessage(tabId, { action: 'STOP_RECORDING' });
  })
}

function createNotification(title, message) {
  const imageURL = chrome.runtime.getURL('get_started48.png');
  const notificationOptions = {
    type: 'basic',
    iconUrl: imageURL,
    title: title,
    message: message,
  };

  chrome.storage.sync.get(['enableNotifications'], function(options) {
    if (options.enableNotifications) {
      chrome.notifications.create('', notificationOptions);
    }
  });
}

(function (VCR) {
  let speechRecognition = webkitSpeechRecognition;
  let speechGrammarList = webkitSpeechGrammarList;
  let commands = ['example', 'save', 'download', 'copy'];
  let grammar = '#JSGF V1.0; grammar colors; public <color> = ' + commands.join(' | ') + ' ;'
  let recognizing = false;
  let onEndCallback = null;
  let recognition, speechRecognitionList;

  VCR.init = function() {
    console.log("Initializing the voice recognizer");
    setupRecognizer();
  };

  VCR.startRecognizing = function(callback) {
    if (recognizing) return;

    recognizing = true;
    onEndCallback = callback;
    recognition.start();
  };

  let setupRecognizer = function() {
    console.log("Setting up the voice recognizer");

    recognition = new speechRecognition();
    speechRecognitionList = new speechGrammarList();
    speechRecognitionList.addFromString(grammar, 1);
    recognition.grammars = speechRecognitionList;
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = onResult;
    recognition.onspeechend = onSpeechEnd;
    recognition.onnomatch = onNoMatch;
    recognition.onerror = onError;
  };

  let onResult = function (e) {
    console.log('Processing result');

    let command = e.results[0][0].transcript;

    if (onEndCallback !== null) {
      let validCommand = false;
      if (commands.includes(command)) {
        validCommand = true;
      }
      onEndCallback(validCommand, e.results[0][0]);
      onEndCallback = null;
    }
  }

  let onSpeechEnd = function (e) {
    recognition.stop();
    recognizing = false;

    console.log('Speech end');

    stopCapturingAudio();
  }

  let onNoMatch = function (e) {
    console.log('No match');

    stopCapturingAudio();
  }

  let onError = function (e) {
    console.error(e.error);

    stopCapturingAudio();
  }
}(window.VoiceCommandRecognizer = window.VoiceCommandRecognizer || {}));

VoiceCommandRecognizer.init();
