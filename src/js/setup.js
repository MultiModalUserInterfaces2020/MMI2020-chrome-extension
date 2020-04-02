'use strict';

requestAccessToMicrophone();

let successContent = document.querySelector('.js-success');
let errorContent = document.querySelector('.js-error');
let tryAgainButton = document.querySelector('.js-try-again');

tryAgainButton.onclick = function() {
  requestAccessToMicrophone();
};

function requestAccessToMicrophone() {
  navigator.webkitGetUserMedia({ audio: true }, mediaStream => {
    console.log(mediaStream);
    onSuccess();
  }, err => {
    console.log(err);
    onError();
  });
}

function onSuccess() {
  errorContent.classList.add('d-none');
  successContent.classList.remove('d-none');
}

function onError() {
  successContent.classList.add('d-none');
  errorContent.classList.remove('d-none');
}
