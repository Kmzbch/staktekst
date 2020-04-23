'use strict';

// import functions
// import('./common_lib.js');

// search engines for bubble menu
const MENU_ITEMS = [{
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
  id: 'netspeak',
  url: 'https://netspeak.org/#q=%s&corpus=web-en'
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

const executeUserCommand = (commandId, text, tabTitle, tabUrl, tabs) => {
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
      chrome.tabs.getZoom(tabs[0].id, (zoomFactor) => {
        zoomFactor = zoomFactor === 1 ? 1.5 : 1;
        chrome.tabs.setZoom(tabs[0].id, zoomFactor, function (zoomFactor) {
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
      case 'OVERLAY_ON':
      case 'OVERLAY_OFF':
        // send message to the current tab
        chrome.tabs.sendMessage(tabs[0].id, {
          command: request.command
        }, () => {
          sendResponse({
            message: 'overlay switched!'
          });
        });
        break;
      default:
        if (request.selection) {
          executeUserCommand(request.command, request.selection, tabs[0].title, tabs[0].url, tabs);
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