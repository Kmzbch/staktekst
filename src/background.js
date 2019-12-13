import CommandPreset from './CommandPreset.js';
import {
  copyTextWithTitleUrl,
  pushText
} from './common_lib.js';

let words = null;

function getMessage(request, sender, sendResponse) {
  if (request.selection) {
    words = request.selection;
    executeCommand(request.command, words);
  } else {
    sendResponse({
      text: words
    });
  }
}

function sendMessage(info, tab) {
  chrome.tabs.sendMessage(tab.id, {
    /* message: "additional message here" */
  }, response => {
    words = response.selection;
    executeCommand(info.menuItemId, words);
  });
}

function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    CommandPreset.PRESET.forEach(item => {
      let picked = (({
        id,
        title,
        type,
        contexts
      }) => ({
        id,
        title,
        type,
        contexts
      }))(item);
      chrome.contextMenus.create(picked);
    });
  });
}

function executeCommand(command, words) {
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, function (tabs) {
    console.log(tabs[0]);
    if (command === 'extendedcopy') {
      copyTextWithTitleUrl(words, tabs[0].title, tabs[0].url);
    } else if (command === 'pushtext') {
      pushText(words, tabs[0].url);
    } else {
      let item = CommandPreset.PRESET.find(item => item.id === command);
      let replacedUrl = item.url.replace('%s', words);
      replacedUrl = replacedUrl.replace('%u', tabs[0].url);
      if (item.hasOwnProperty('option')) {
        item.option({
          text: words,
          url: replacedUrl,
          tab: tabs[0]
        });
      } else {
        chrome.tabs.create({
          url: replacedUrl
        });
      }
    }
  });
}

chrome.runtime.onMessage.addListener(getMessage);

chrome.contextMenus.onClicked.addListener(sendMessage);

createContextMenus();