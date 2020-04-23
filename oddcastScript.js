'use strict';

const WAIT = 4000;

chrome.runtime.sendMessage({}, response => {
  // get the input form of the page
  let sourceInput = document.querySelector('#flash-speck-area');
  let sourceLanguage = document.querySelector('#languageBtn');
  let sourceVoice = document.querySelector('#voiceBtn');
  let sourceEffect = document.querySelector('#effectBtn');
  let sourceLevel = document.querySelector('#levelBtn');

  // set parameters to the value/attributes
  sourceInput.value = response.text;
  sourceLanguage.setAttribute('data-val', '1');
  sourceVoice.setAttribute('data-val', '7');
  sourceVoice.setAttribute('data-eng', '3');
  sourceEffect.setAttribute('data-val', 'T');
  sourceLevel.setAttribute('data-val', '2');

  // fire click event after a while
  setTimeout(() => {
    document.querySelector('#play-speaking').click();
  }, WAIT);
});