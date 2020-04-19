'use strict';

// This file is injected into every web page and has access to the dom of the page

(function (window, MousePosition) {
  let x = 0, y= 0;

  window.addEventListener('mousemove', function (e) {
    x = e.clientX;
    y = e.clientY;
  });

  MousePosition.getPosition = function() {
    return { x: x, y:y };
  };
}(window, window.MousePosition = window.MousePosition || {}));

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'RETURN_FIRST_IMAGE') {

  }

  switch (request.action) {
    case 'RETURN_FIRST_IMAGE':
      sendResponse(downloadFirstImage());
      break;

    case 'DOWNLOAD_IMAGE':
      sendResponse(downloadImage());
      break;
  }
});

function downloadFirstImage() {
  const images = document.querySelectorAll('img');

  if (images.length) {
    const source = images[0].getAttribute('src');
    downloadSource(source);

    return source;
  } else {
    return false;
  }
}

function downloadImage() {
  let position = MousePosition.getPosition();
  let element = document.elementFromPoint(position.x, position.y);

  if (element.nodeName !== 'IMG' || !element.hasAttribute('src')) {
    return false;
  }

  let previousStyle = element.hasAttribute('style') ? element.getAttribute('style') : '';
  let highlightStyle = previousStyle + '; box-shadow: 0 0 10px red';
  element.setAttribute('style', highlightStyle);

  window.setTimeout(function () {
    element.setAttribute('style', previousStyle);
  }, 3000);

  let source = element.getAttribute('src');
  downloadSource(source);

  return source;
}

function downloadSource(source) {
  // TODO: Find better method to download a file using js
  let link = document.createElement('a');
  link.href = source;
  link.download = '';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
