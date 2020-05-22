'use strict';
// This file is injected into every web page and has access to the dom of the page

let lastX = 0.0, lastY = 0.0;
let useMouse = true;
let lastPositions = [];
let recordLastPositions = false;

function updateLastCoords(x,y) {
	lastX = x;
  lastY = y;
  eyePositionIndicator.style.left = x + "px";
  eyePositionIndicator.style.top = y + "px";

  if (recordLastPositions) {
    lastPositions.push({x:x,y:y,t:new Date().getTime()});
  }
}

(function (window, MousePosition) {
  let x = 0, y= 0;

  window.addEventListener('mousemove', function (e) {
    x = e.clientX;
    y = e.clientY;
    // This works since the first method call comes after the initialization and is global inside the script (var).
    updateLastCoords(x,y);
  });

  MousePosition.getPosition = function() {
    return { x: x, y:y };
  };
}(window, window.MousePosition = window.MousePosition || {}));

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

let eyePositionIndicator = document.createElement('div');
eyePositionIndicator.id = 'eyePositionIndicator';
eyePositionIndicator.style.width = '12px';
eyePositionIndicator.style.height = '12px';
eyePositionIndicator.style.background = 'red';
eyePositionIndicator.style.borderRadius = '6px';
eyePositionIndicator.style.position = 'fixed';
eyePositionIndicator.style.zIndex = 9999;
eyePositionIndicator.style.left = '20px';
eyePositionIndicator.style.top = '20px';
eyePositionIndicator.style.marginLeft = '-6px';
eyePositionIndicator.style.marginTop = '-6px';

document.body.appendChild(eyePositionIndicator);

let averageEyePositionIndicator = document.createElement('div');
averageEyePositionIndicator.id = 'averageEyePositionIndicator';
averageEyePositionIndicator.style.width = '12px';
averageEyePositionIndicator.style.height = '12px';
averageEyePositionIndicator.style.background = 'green';
averageEyePositionIndicator.style.borderRadius = '5px';
averageEyePositionIndicator.style.position = 'fixed';
averageEyePositionIndicator.style.zIndex = 9999;
averageEyePositionIndicator.style.left = '10px';
averageEyePositionIndicator.style.top = '10px';
eyePositionIndicator.style.marginLeft = '-6px';
eyePositionIndicator.style.marginTop = '-6px';

document.body.appendChild(averageEyePositionIndicator);

let offsetX = 0.0, offsetY = 0.0;

chrome.storage.sync.get(['visualizeEyePosition'], function(options) {
  if (options.visualizeEyePosition) {
    useMouse = false;

    let wsUri = "ws://127.0.0.1:8181/";
    let websocket = new WebSocket(wsUri);

    websocket.onopen = function (e) {
        console.log("Connection with TobiiEye server opened");
    };
    websocket.onclose = function (e) {
      console.log("Connection with TobiiEye server closed");
    };
    websocket.onerror = function (e) {
      createNotification("No TobiiEye Server", "Extension was not able to connect to TobiiEye server. Switched to mouse recognition.");
      console.log("Extension was not able to connect to TobiiEye server. Switched to mouse recognition");
      mouseMode(true);
    };
    websocket.onmessage = function (e) {
      if(!useMouse) {
        let coords = e.data.split(";");
        applyCoordinates(coords);
      }
    };
  }
});

/**
 * Sets recording to true so that the event listeners now write teh results into the array.
 * Clears the array and puts the last position (actual one) to it.
 */
function startRecordingPosition() {
  lastPositions = [];
  lastPositions.push({x:lastX,y:lastY,t:new Date().getTime()});
  recordLastPositions = true;

  return recordLastPositions;
}

function stopRecordingPosition() {
  recordLastPositions = false;
  lastPositions.push({x:lastX,y:lastY,t:new Date().getTime()});

  return !recordLastPositions;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'RETURN_FIRST_IMAGE') { }

  switch (request.action) {
    case 'RETURN_FIRST_IMAGE':
      sendResponse(downloadFirstImage());
      break;

    case 'DOWNLOAD_IMAGE':
      sendResponse(downloadImage());
      break;

    case 'START_RECORDING':
      startRecordingPosition();
      break;

    case 'STOP_RECORDING':
      stopRecordingPosition();
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

/**
 * Calculates the average mouse position by time spend on it
 */
function getAveragePosition() {
  if (lastPositions.length === 0) {
    if (useMouse) {
      return MousePosition.getPosition();
    } else {
      return getLastCoords();
    }
  } else if (lastPositions.length === 1) {
    return {x:lastPositions[0].x, y:lastPositions[0].y};
  }

  let totalX = 0;
  let totalY = 0;
  let totalTime = lastPositions[lastPositions.length-1].t - lastPositions[0].t;
  
  // the very last position is ignored
  for (let i = 0; i < lastPositions.length - 1; i++) {
    let time = lastPositions[i+1].t - lastPositions[i].t;
    totalX += lastPositions[i].x * time;
    totalY += lastPositions[i].y * time;
  }

  return {x:totalX/totalTime, y:totalY/totalTime};
}

function downloadImage() {
  let position = getAveragePosition();
  averageEyePositionIndicator.style.left = position.x + "px";
  averageEyePositionIndicator.style.top = position.y + "px";
  recordLastPositions = false;
  lastPositions = [];
  
  let element = getElementFromPoint(position.x, position.y);

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

function getElementFromPoint(x, y) {
  let elements = document.elementsFromPoint(x, y);

  if (elements[0].id === 'eyePositionIndicator' || elements[0].id === 'averageEyePositionIndicator') {
    return elements[1];
  } else {
    return elements[0];
  }
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

//================================================
//=========== TOBII ==============================
//================================================

function getLastCoords() {
	return {x:lastX, y:lastY};
}

function applyCoordinates(coords) {
    let tracked_values ={
        browser_x : Mir_windowTools.get_browserweb_coordinates().x,
        browser_y : Mir_windowTools.get_browserweb_coordinates().y,
        browser_width : Mir_windowTools.get_browserweb_size().width,
        browser_height : Mir_windowTools.get_browserweb_size().height,
        viewport_width : Mir_windowTools.get_viewPort_size().width,
        viewport_height : Mir_windowTools.get_viewPort_size().height,
        calculated_viewport_x : Mir_windowTools.get_browserweb_coordinates().x,
        calculated_viewport_y : Mir_windowTools.get_browserweb_coordinates().y + (Mir_windowTools.get_browserweb_size().height - Mir_windowTools.get_viewPort_size().height),
		    screen_width : Mir_windowTools.get_screen_size().width,
        screen_height : Mir_windowTools.get_screen_size().height,
    };
	
	let newX = coords[0] * tracked_values.screen_width - tracked_values.calculated_viewport_x + offsetX;
  let newY = coords[1] * tracked_values.screen_height - tracked_values.calculated_viewport_y + offsetY;
    
  updateLastCoords(newX,newY);
}

function mouseMode(value) {
	useMouse = value;

	if (useMouse) {
		document.addEventListener('mousemove', e => updateLastCoords(e.pageX,e.pageY));
	} else {
		document.removeEventListener('mousemove', e => updateLastCoords(e.pageX,e.pageY));
	}
}

// TOOLS for position transpose

if (!Mir_windowTools) {
  var Mir_windowTools = {};
}

Mir_windowTools = {
    scrollBarPadding: 17, // padding to assume for scroll bars

    //CUSTOM
    get_browserweb_coordinates: function () {
        //NOT SUPPORTED by IE8 or less
        let coordX = (typeof window.screenLeft == "number") ? window.screenLeft : window.screenX;
        let coordY = (typeof window.screenTop == "number") ? window.screenTop : window.screenY;

        return {
            x: coordX,
            y: coordY
        };
    },

    //CUSTOM
    get_browserweb_size: function () {
        //NOT SUPPORTED by IE8 or less
        let width = window.outerWidth;
        let height = window.outerHeight;
        let result = {};
        result.width = width;
        result.height = height;

        return result;
    },

    get_document_size: function () {
        // document dimensions
        let viewportWidth, viewportHeight;

        if (window.innerHeight && window.scrollMaxY) {
            viewportWidth = document.body.scrollWidth;
            viewportHeight = window.innerHeight + window.scrollMaxY;
        } else if (document.body.scrollHeight > document.body.offsetHeight) {
            // all but explorer mac
            viewportWidth = document.body.scrollWidth;
            viewportHeight = document.body.scrollHeight;
        } else {
            // explorer mac...would also work in explorer 6 strict, mozilla and safari
            viewportWidth = document.body.offsetWidth;
            viewportHeight = document.body.offsetHeight;
        }

        return {
            width: viewportWidth,
            height: viewportHeight
        };
    },

    get_viewPort_size: function () {
        // view port dimensions
        let windowWidth, windowHeight;

        if (self.innerHeight) {
            // all except explorer
            windowWidth = self.innerWidth;
            windowHeight = self.innerHeight;
        } else if (document.documentElement && document.documentElement.clientHeight) {
            // explorer 6 strict mode
            windowWidth = document.documentElement.clientWidth;
            windowHeight = document.documentElement.clientHeight;
        } else if (document.body) {
            // other explorers
            windowWidth = document.body.clientWidth;
            windowHeight = document.body.clientHeight;
        }

        return {
            width: windowWidth,
            height: windowHeight
        };
    },

    get_scroll_offset: function () {
        // viewport vertical scroll offset
        let horizontalOffset, verticalOffset;

        if (self.pageYOffset) {
            horizontalOffset = self.pageXOffset;
            verticalOffset = self.pageYOffset;
        } else if (document.documentElement && document.documentElement.scrollTop) {
            // Explorer 6 Strict
            horizontalOffset = document.documentElement.scrollLeft;
            verticalOffset = document.documentElement.scrollTop;
        } else if (document.body) {
            // all other Explorers
            horizontalOffset = document.body.scrollLeft;
            verticalOffset = document.body.scrollTop;
        }

        return {
            horizontal: horizontalOffset,
            vertical: verticalOffset
        };
    },
	
    get_screen_size: function() {
        return {
            height: window.screen.height,
            width: window.screen.width
        };
    }
};
