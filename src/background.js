import CommandPreset from './CommandPreset.js';
import {
  copyTextWithTitleUrl,
  pushText
} from './common_lib.js';

let words = null;

let isDev = true;

/* communicate with other scripts */
function getMessage(request, sender, sendResponse) {
  if (request.selection) {
    words = request.selection;
    executeCommand(request.command, words);
    sendResponse({});
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
    CommandPreset.PRESET_CONTEXT_MENUS.forEach(item => {
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
  }, tabs => {
    if (command === 'extendedcopy') {
      copyTextWithTitleUrl(words, tabs[0].title, tabs[0].url);
    } else if (command === 'pushtext') {
      pushText(words, tabs[0].url, tabs[0].title);
    } else {
      let item = CommandPreset.PRESET_CONTEXT_MENUS.find(item => item.id === command);
      let replacedUrl = item.url.replace('%s', words);
      replacedUrl = replacedUrl.replace('%u', tabs[0].url);

      if (isDev) {
        if (item.hasOwnProperty('option')) {
          item.option({
            text: words,
            url: replacedUrl,
            tab: tabs[0]
          });
        } else {
          // normal
          // chrome.tabs.create({
          //   url: replacedUrl
          // });

          // panel
          chrome.windows.create({
            url: replacedUrl,
            type: "panel",
            width: 600,
            height: 700
          });
        }
      } else {

        chrome.windows.create({
          url: replacedUrl,
          type: "popup",
          width: 480,
          height: 700,
          left: (825 - 450),
          focused: true,
        }, res => {
          console.log(res);
        });




      }

    }
  });
}

// createContextMenus();

chrome.runtime.onMessage.addListener(getMessage);
chrome.contextMenus.onClicked.addListener(sendMessage);