'use strict';
// This file is injected into every web page and has access to the dom of the page

(function (window, MousePosition) {
  let x = 0, y= 0;

  window.addEventListener('mousemove', function (e) {
    x = e.clientX;
    y = e.clientY;
    // This works since the first method call comes after the initialization and is global inside the script (var).
    if(useMouse) {
      indicator.style.left=x+"px";
      indicator.style.top=y+"px";
    }
  });

  MousePosition.getPosition = function() {
    return { x: x, y:y };
  };
}(window, window.MousePosition = window.MousePosition || {}));

var indicator = document.createElement("div");
indicator.id = "indicator";
indicator.style.width = "10px";
indicator.style.height = "10px";
indicator.style.background = "red";
indicator.style.borderRadius = "5px";
indicator.style.position = "fixed";
indicator.style.zIndex = 9999;
indicator.style.left="20px";
indicator.style.top="20px";

document.body.appendChild(indicator);

var offsetX = 0.0, offsetY = 0.0;
var lastX = 0.0, lastY = 0.0;
var useMouse = false;

var wsUri = "ws://127.0.0.1:8181/";
var websocket = new WebSocket(wsUri);

websocket.onopen = function (e) {
    console.log("Connection with TobiiEye server opened");
 };
websocket.onclose = function (e) {
   console.log("Connection with TobiiEye server closed");
};
websocket.onerror = function (e) {
  console.log("Extension was not able to connect to TobiiEye server. Switched to mouse recognition");
  mouseMode(true);
};
websocket.onmessage = function (e) {
	if(!useMouse) {
    var coords = e.data.split(";");
		applyCoordinates(coords);
	}
};

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
  let position;
  if(useMouse){
    position = MousePosition.getPosition();
  } else {
    position = getLastCoords();
  }
  
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

//================================================
//=========== TOBII ==============================
//================================================

function updateLastCoords(x,y) {
	lastX = x;
  lastY = y;
  indicator.style.left=x+"px";
  indicator.style.top=y+"px";
}

function getLastCoords() {
	return {x:lastX, y:lastY};
}

function applyCoordinates(coords) {
    var tracked_values ={
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
	
	var newX = coords[0] * tracked_values.screen_width - tracked_values.calculated_viewport_x + offsetX;
  var newY = coords[1] * tracked_values.screen_height - tracked_values.calculated_viewport_y + offsetY;
    
  updateLastCoords(newX,newY);
}

function mouseMode(value) {
	useMouse = value;
	if(useMouse) {
		document.addEventListener('mousemove', e => updateLastCoords(e.pageX,e.pageY));
	} else {
		document.removeEventListener('mousemove', e => updateLastCoords(e.pageX,e.pageY));
	}
}

// TOOLS for position transpose

if (!Mir_windowTools) { var Mir_windowTools = new Object(); };

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
        var width = window.outerWidth;
        var height = window.outerHeight;
        var result = {};
        result.width = width;
        result.height = height;

        return result;
    },

    get_document_size: function () {
        // document dimensions
        var viewportWidth, viewportHeight;
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
        };
        return {
            width: viewportWidth,
            height: viewportHeight
        };
    },

    get_viewPort_size: function () {
        // view port dimensions
        var windowWidth, windowHeight;
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
        };
        return {
            width: windowWidth,
            height: windowHeight
        };
    },

    get_scroll_offset: function () {
        // viewport vertical scroll offset
        var horizontalOffset, verticalOffset;
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
        };
        return {
            horizontal: horizontalOffset,
            vertical: verticalOffset
        };
    },
	
    get_screen_size: function() 
    {
        return {
            height: window.screen.height,
            width: window.screen.width
        };
    },
};