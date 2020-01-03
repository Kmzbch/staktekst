'use strict';

import {
  copyTextWithTitleUrl,
  pushText,
  zoomToFit
} from './common_lib.js';

const BUBBLE_MENUS = [{
    id: "mirai",
    title: "みらい翻訳（英→日）",
    url: "https://miraitranslate.com/en/trial/",
  },
  {
    id: "odd",
    title: "A Jump to the Sky Turns to a Riderkick",
    url: "http://www.oddcast.com/ttsdemo/index.php",
  },
  {
    id: "extendedcopy",
    title: "URL付きでコピー",
  },
  {
    id: "pushtext",
    title: "テキストをプッシュ",
  },
  {
    id: "youglish",
    title: "Youglish",
    url: "https://youglish.com/search/%s",
  },
  {
    id: "dopeoplesayit",
    title: "Do People Say It",
    url: "https://dopeoplesay.com/q/%s",
  },
  {
    id: "skell",
    title: "SKELL",
    url: "https://skell.sketchengine.co.uk/run.cgi/concordance?lpos=&query=%s",
  },
  {
    id: "twitter",
    title: "Twitter",
    url: "https://twitter.com/search?q=%s",
  },
  {
    id: "vocabulary",
    title: "Vocabulary.com",
    url: "https://www.vocabulary.com/dictionary/%s",
  },
  {
    id: "urban",
    title: "Urban Dictionary",
    url: "https://www.urbandictionary.com/define.php?term=%s",
  },
  {
    id: "google",
    title: "Google画像検索",
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
        console.log(zoomFactor);
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
    // https://qiita.com/Tachibana446/items/ab15021099d54d1209c2
  }
  return true;
}

let selectedTextHolder = null;

chrome.runtime.onMessage.addListener(getMessage);