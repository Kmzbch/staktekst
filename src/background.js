'use strict';

import {
  copyTextWithTitleUrl,
  pushText,
  zoomToFit
} from './common_lib.js';

const BUBBLE_MENUS = [{
    id: "mirai",
    url: "https://miraitranslate.com/en/trial/",
  },
  {
    id: "oddcast",
    url: "http://www.oddcast.com/ttsdemo/index.php",
  },
  {
    id: "extendedcopy",
  },
  {
    id: "pushtext",
  },
  {
    id: "youglish",
    url: "https://youglish.com/search/%s",
  },
  {
    id: "dopeoplesayit",
    url: "https://dopeoplesay.com/q/%s",
  },
  {
    id: "skell",
    url: "https://skell.sketchengine.co.uk/run.cgi/concordance?lpos=&query=%s",
  },
  {
    id: "twitter",
    url: "https://twitter.com/search?q=%s",
  },
  {
    id: "vocabulary",
    url: "https://www.vocabulary.com/dictionary/%s",
  },
  {
    id: "urban",
    url: "https://www.urbandictionary.com/define.php?term=%s",
  },
  {
    id: "google",
    url: "https://encrypted.google.com/search?hl=en&gl=en&tbm=isch&q=%s",
  },
];

const executeCommand = (commandId, text = '') => {
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, tabs => {
    if (commandId === 'extendedcopy') {
      copyTextWithTitleUrl(text, tabs[0].title, tabs[0].url);
    } else if (commandId === 'pushtext') {
      let type = 'clip';
      pushText(text, type, tabs[0].title, tabs[0].url);
    } else if (commandId === 'bookmark') {
      text = tabs[0].title + '\n' + tabs[0].url;
      let type = 'bookmark';
      pushText(text, type, '', '');
    } else if (commandId === 'zoomtofit') {
      zoomToFit(tabs[0]);
    } else {
      let command = BUBBLE_MENUS.find(item => item.id === commandId);
      let urlWithQuery = command.url.replace('%s', text);
      chrome.tabs.create({
        url: urlWithQuery
      });
      // let offsetX = Math.floor(screen.width / 2);
      // chrome.windows.create({
      //   url: urlWithQuery,
      //   type: "panel",
      //   width: offsetX,
      //   height: 912,
      //   left: 0
      // });
    }
  });
}

const getMessage = (request, sender, sendResponse) => {
  if (request.command === 'GET_ZOOMFACTOR') {
    chrome.tabs.query({
      currentWindow: true,
      active: true
    }, function (tabs) {
      chrome.tabs.getZoom(tabs[0].id, (zoomFactor) => {
        sendResponse({
          zoomFactor: zoomFactor
        });
      })
    });
  } else {
    if (request.selection) {
      selectedTextHolder = request.selection;
      executeCommand(request.command, selectedTextHolder);
    }
    sendResponse({
      // only used for mirai translate and oddcast
      text: selectedTextHolder
    });
  }
  return true;
}

let selectedTextHolder = null;

chrome.runtime.onMessage.addListener(getMessage);