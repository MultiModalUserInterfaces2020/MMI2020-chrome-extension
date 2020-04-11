'use strict';

let speechRecognition = webkitSpeechRecognition;
let speechGrammarList = webkitSpeechGrammarList;
let speechRecognitionEvent = webkitSpeechRecognitionEvent;

let colors = [ 'aqua' , 'azure' , 'beige', 'bisque', 'black', 'blue', 'brown', 'chocolate', 'coral', 'crimson', 'cyan', 'fuchsia', 'ghostwhite', 'gold', 'goldenrod', 'gray', 'green', 'indigo', 'ivory', 'khaki', 'lavender', 'lime', 'linen', 'magenta', 'maroon', 'moccasin', 'navy', 'olive', 'orange', 'orchid', 'peru', 'pink', 'plum', 'purple', 'red', 'salmon', 'sienna', 'silver', 'snow', 'tan', 'teal', 'thistle', 'tomato', 'turquoise', 'violet', 'white', 'yellow'];
let grammar = '#JSGF V1.0; grammar colors; public <color> = ' + colors.join(' | ') + ' ;'
let grammarCommand = '#JSGF V1.0 ISO8859-1 en; grammar com.acme.commands;'+
    ' public <basicCmd> = <command>; <command> = /2/ select |/1/ deselect |/2/ save |/1/ cancel ;'
console.log('Ready demo');

let recognition = new speechRecognition();
let speechRecognitionList = new speechGrammarList();
speechRecognitionList.addFromString(grammar, 1);
speechRecognitionList.addFromString(grammarCommand);
recognition.grammars = speechRecognitionList;
recognition.continuous = false;
recognition.lang = 'en-US';
recognition.interimResults = false;
recognition.maxAlternatives = 1;

let diagnostic = document.querySelector('.output');
let bg = document.querySelector('html');
let hints = document.querySelector('.hints');

let colorHTML= '';
colors.forEach(function(v, i, a){
  console.log(v, i);
  colorHTML += '<span class="color-pill" style="background-color:' + v + ';"> ' + v + ' </span>';
});
hints.innerHTML = colorHTML;

document.body.onclick = function() {
  recognition.start();
  console.log('Ready to receive a color command.');
}

//Function to retrieve position of the mouse --> TO CHANGE WITH EYETRACKER
let xMousePosition = 0;
let yMousePosition = 0;
window.addEventListener('mousemove', function (e){
  xMousePosition = e.x;
  yMousePosition = e.y;
});

//Listen to registered command
chrome.commands.onCommand.addListener(function(command) {
  console.log('Command:', command);
  recognition.start();
  console.log('Ready to receive a command.');
  const imageURL = chrome.runtime.getURL('get_started48.png');
  const notificationOptions = {
    type: 'basic',
    iconUrl: imageURL,
    title: 'Activation of voice recognition',
    message: "The extension is now listening to your voice !"
  }
  chrome.notifications.create('listeningToVoice', notificationOptions);
});



recognition.onresult = function(event) {
  // The SpeechRecognitionEvent results property returns a SpeechRecognitionResultList object
  // The SpeechRecognitionResultList object contains SpeechRecognitionResult objects.
  // It has a getter so it can be accessed like an array
  // The first [0] returns the SpeechRecognitionResult at the last position.
  // Each SpeechRecognitionResult object contains SpeechRecognitionAlternative objects that contain individual results.
  // These also have getters so they can be accessed like arrays.
  // The second [0] returns the SpeechRecognitionAlternative at position 0.
  // We then return the transcript property of the SpeechRecognitionAlternative object
  let color = event.results[0][0].transcript;
  if(color != 'save'){
    diagnostic.textContent = 'Result received: ' + color + '.';
    bg.style.backgroundColor = color;
  }
  else{
    let image = document.elementFromPoint(xMousePosition, yMousePosition);
    //feedback : draw a red rectangle around the picture
    let ctx = image.id[0].getContext("2d"); //this line throw an error "Cannot read property 'getContext' of undefined"
    ctx.beginPath();
    let pos = image.getBoundingClientRect();
    ctx.rect(pos.x,pos.y,pos.width,pos.height);
    ctx.strokeStyle = "red";
    ctx.stroke();

    //save image
    //TO DO
  }
  console.log('Confidence: ' + event.results[0][0].confidence);
}

recognition.onspeechend = function() {
  recognition.stop();
}

recognition.onnomatch = function(event) {
  diagnostic.textContent = "I didn't recognise that color.";
}

recognition.onerror = function(event) {
  diagnostic.textContent = 'Error occurred in recognition: ' + event.error;
}
