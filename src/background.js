let words = null;

import {
  getCommandCollection
} from './CommandCollection.js';
let commandCollection = getCommandCollection();


chrome.runtime.onMessage.addListener(getMessage);

function getMessage(request, sender, sendResponse) {
  console.log("received message");
  words = request.selection;
  let command = request.command;
  executeCommand(command, words);
  sendResponse({
    text: words
  });
}

chrome.contextMenus.onClicked.addListener((menuInfo, tab) => {
  chrome.tabs.sendMessage(tab.id, {
    /* message: "additional message here" */
  }, response => {
    words = response.selection;
    executeCommand(menuInfo.menuItemId, words);

  });
});

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
      let item = commandCollection.find(item => item.id === command);
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


createContextMenus();

function createContextMenus() {
  chrome.contextMenus.removeAll(() => {

    // let commandCollection = getCommandCollection();
    commandCollection.forEach(item => {
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

function copyTextWithTitleUrl(text, title, url) {
  // use hidden DOM to copy text
  var copyFrom = document.createElement("textarea");
  copyFrom.textContent = text + "\n\n" + title + "\n" + url;
  document.body.appendChild(copyFrom);
  copyFrom.select();
  document.execCommand('copy');
  copyFrom.blur();
  document.body.removeChild(copyFrom);
}

function pushText(text, url) {
  chrome.storage.sync.get(['raw'], result => {
    let itemlist = [];
    if (typeof result.raw !== "undefined") {
      itemlist = JSON.parse(result.raw);
    }
    itemlist.push({
      text,
      url
    });
    chrome.storage.sync.set({
        raw: JSON.stringify(itemlist),
      },
      () => {
        console.log("Added: " + text + ' & ' + url);
      });
  });
}