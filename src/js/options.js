'use strict';

function saveOptions() {
  let enableNotifications = document.getElementById('enable_notifications').checked;
  let visualizeEyePosition = document.getElementById('visualize_eye_position').checked;

  chrome.storage.sync.set({
    enableNotifications: enableNotifications,
    visualizeEyePosition: visualizeEyePosition
  }, function() {
    let status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 1500);
  });
}

function restoreOptions() {
  // Set default values
  chrome.storage.sync.get({
    enableNotifications: true,
    visualizeEyePosition: false
  }, function(items) {
    document.getElementById('enable_notifications').checked = items.enableNotifications;
    document.getElementById('visualize_eye_position').checked = items.visualizeEyePosition;
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
