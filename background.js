'use strict';

// search engines for bubble menu
const MENU_ITEMS = [{
  id: "mirai",
  url: "https://miraitranslate.com/en/trial/",
  title: "みらい翻訳（英→日）",
  contexts: ["selection"],
},
{
  id: "oddcast",
  title: "Oddcastでテキスト読み上げ（英）",
  contexts: ["selection"],
  url: "http://www.oddcast.com/ttsdemo/index.php",
},
{
  id: "extendedcopy",
  title: "URL付きでコピー",
  contexts: ["selection"],
},
{
  id: "pushtext",
  title: "テキストをスタックにプッシュ",
  contexts: ["page", "selection"],
},
{
  id: "youglish",
  title: "Youglish",
  contexts: ["selection"],
  url: "https://youglish.com/search/%s",
},
{
  id: "dopeoplesayit",
  title: "Do People Say It",
  contexts: ["selection"],
  url: "https://dopeoplesay.com/q/%s",
},
{
  id: "skell",
  title: "SKELL",
  contexts: ["selection"],
  url: "https://skell.sketchengine.co.uk/run.cgi/concordance?lpos=&query=%s",
},
{
  id: 'netspeak',
  title: "NetSpeak",
  contexts: ["selection"],
  url: 'https://netspeak.org/#q=%s&corpus=web-en'
},
{
  id: "twitter",
  title: "Twitter",
  contexts: ["selection"],
  url: "https://twitter.com/search?q=%s",
},
{
  id: "vocabulary",
  title: "Vocabulary.com",
  contexts: ["selection"],
  url: "https://www.vocabulary.com/dictionary/%s",
},
{
  id: "urban",
  title: "Urban Dictionary",
  contexts: ["selection"],
  url: "https://www.urbandictionary.com/define.php?term=%s",
},
{
  id: "google",
  title: "Google検索",
  contexts: ["selection"],
  url: "https://encrypted.google.com/search?hl=en&gl=en&q=%s",
},
];


const executeUserCommand = (commandId, text, tabTitle, tabUrl, tabId) => {
  console.log(commandId);

  switch (commandId) {

    // system features
    case 'extendedcopy':
      copyTextWithTitleUrl(text, tabTitle, tabUrl);
      break;
    case 'pushtext':
      pushText(text, 'clip', tabTitle, tabUrl);
      break;
    case 'bookmark':
      pushText(tabTitle + '\n' + tabUrl, 'bookmark', '', '');
      break;
    case 'switchzoom':
      chrome.tabs.getZoom(tabId, (zoomFactor) => {
        zoomFactor = zoomFactor === 1 ? 1.5 : 1;
        chrome.tabs.setZoom(tabId, zoomFactor, function (zoomFactor) {
          console.log("zoom factor:" + zoomFactor);
        })
      })
      break;
    // web features
    default:
      let command = MENU_ITEMS.find(item => item.id === commandId);
      let urlWithQuery = command.url.replace('%s', text);
      // open the URL
      chrome.tabs.create({
        url: urlWithQuery
      });
      break;
  }
}

// get a message from content script
const getMessage = (request, sender, sendResponse) => {
  // message info
  console.log(sender.tab ?
    "from a content script:" + sender.tab.url :
    "from the extension");
  console.log(request.command);

  // query for the current tab
  chrome.tabs.query({
    currentWindow: true,
    active: true
  }, (tabs) => {
    switch (request.command) {
      case 'GET_ZOOMFACTOR':
        // get the current zoom factor
        chrome.tabs.getZoom(tabs[0].id, (zoomFactor) => {
          sendResponse({
            zoomFactor: zoomFactor
          });
        })
        break;
      default:
        if (request.selection) {
          executeUserCommand(request.command, request.selection, tabs[0].title, tabs[0].url, tabs[0].id);
          selectionHolder = request.selection;
          commandHolder = request.command;
        }
        sendResponse({
          text: selectionHolder, // only used for mirai translate and oddcast
          command: commandHolder
        });

        break;
    }
  });

  return true;
}

let selectionHolder = null;
let commandHolder = "";

// attach getMessage to onMessage event
chrome.runtime.onMessage.addListener(getMessage);

// attach context menu onclicked ivent
chrome.contextMenus.onClicked.addListener((menuInfo, tab) => {
  chrome.tabs.sendMessage(tab.id, {
    command: 'GET_SELCTION'
    /* message: "additional message here" */
  }, response => {
    let text = response.selection;
    executeUserCommand(menuInfo.menuItemId, text, tab.title, tab.url, tab.id);
    selectionHolder = text;
    commandHolder = menuInfo.menuItemId;
  });
});

// reset and create context menus
chrome.contextMenus.removeAll(() => {
  MENU_ITEMS.forEach(item => {
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
