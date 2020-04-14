'use strict';

// This file is injected into every web page and has access to the dom of the page

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'RETURN_FIRST_IMAGE') {
    let result = downloadFirstImage();
    sendResponse(result);
  }
});

function downloadFirstImage() {
  const images = document.querySelectorAll('img');

  if (images.length) {
    const source = images[0].getAttribute('src');

    // TODO: Find better method to download a file using js
    let link = document.createElement('a');
    link.href = source;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return source;
  } else {
    return false;
  }
}
