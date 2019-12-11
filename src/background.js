let words = null;

import {
  getCommandCollection
} from './CommandCollection.js';
let commandCollection = getCommandCollection();


chrome.runtime.onMessage.addListener(getMessage);

function getMessage(request, sender, sendResponse) {
  console.log("received message");
  // words = response.selection;

  // if (response.action === 'extendedcopy') {
  //   copyTextWithTitleUrl(words, tab.title, tab.url);
  // } else if (response.action === 'pushtext') {
  //   pushText(words, tab.url);
  // } else {
  //   let item = contextMenuItems.find(item => item.id === response.action);
  //   let url = item.url.replace('%s', words);
  //   url = url.replace('%u', tab.url);
  //   if (item.hasOwnProperty('option')) {
  //     item.option({
  //       text: words,
  //       url: url,
  //       tab: tab
  //     });
  //   } else {
  //     chrome.tabs.create({
  //       url: url
  //     });
  //   }
  // }


  sendResponse({
    text: words
  });
}

chrome.contextMenus.onClicked.addListener((menuInfo, tab) => {
  chrome.tabs.sendMessage(tab.id, {
    /* message: "additional message here" */
  }, response => {
    words = response.selection;

    if (menuInfo.menuItemId === 'extendedcopy') {
      copyTextWithTitleUrl(words, tab.title, tab.url);
    } else if (menuInfo.menuItemId === 'pushtext') {
      pushText(words, tab.url);
    } else {
      let item = commandCollection.find(item => item.id === menuInfo.menuItemId);

      let url = item.url.replace('%s', words);
      url = url.replace('%u', tab.url);
      if (item.hasOwnProperty('option')) {
        item.option({
          text: words,
          url: url,
          tab: tab
        });
      } else {
        chrome.tabs.create({
          url: url
        });
      }
    }
  });
});

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