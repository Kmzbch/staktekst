let words = null;

chrome.runtime.onMessage.addListener(getMessage);

function getMessage(request, sender, sendResponse) {
  sendResponse({
    text: words
  });
}

chrome.contextMenus.onClicked.addListener((menuInfo, tab) => {
  chrome.tabs.sendMessage(tab.id, {
    /* message: "additional message here" */
  }, response => {
    console.log(words);

    words = response.selection;
    if (menuInfo.menuItemId === 'extendedcopy') {
      copyTextWithTitleUrl(words, tab.title, tab.url);
    } else if (menuInfo.menuItemId === 'pushtext') {
      pushText(words, tab.url);
    } else {
      let item = contextMenuItems.find(engine => engine.id === menuInfo.menuItemId);
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

function pushText(text, url) {
  stackStorage.get(raw => {
    let itemlist = [];
    let newItem = {
      text: text,
      url: url
    };
    if (typeof raw !== "undefined") {
      itemlist = JSON.parse(raw);
      console.log(itemlist);
    }
    itemlist.push(newItem);
    stackStorage.set(JSON.stringify(itemlist), () => {
      console.log("Added: " + newItem.text + '&' + newItem.url);
    });
  });
}

function copyTextWithTitleUrl(text, title, url) {
  var copyFrom = document.createElement("textarea");
  copyFrom.textContent = text + "\n\n" + title + "\n" + url;
  document.body.appendChild(copyFrom);
  copyFrom.select();
  document.execCommand('copy');
  copyFrom.blur();
  document.body.removeChild(copyFrom);
}

function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    contextMenuItems.forEach(item => {
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

const stackStorage = {
  get: callback => {
    chrome.storage.sync.get(['raw'], result => {
      callback(result.raw);
    });
  },
  set: (value, callback) => {
    chrome.storage.sync.set({
        raw: value,
      },
      () => {
        callback();
      });
  }
};

const contextMenuItems = [{
    id: "mirai",
    title: "みらい翻訳（英→日）",
    contexts: ["selection"],
    url: "https://miraitranslate.com/en/trial/",
  },
  {
    id: "odd",
    title: "A Jump to the Sky Turns to a Riderkick",
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
    title: "テキストをプッシュ",
    contexts: ["page", "selection"],
  },
  {
    id: "sep1",
    type: 'separator',
    contexts: ["selection"],
  },
  {
    id: "youglish",
    title: "Youglish",
    contexts: ["selection"],
    url: "https://youglish.com/search/%s",
    option: ({
      url
    }) => {
      chrome.windows.create({
        url: url,
        type: "popup",
        width: 480,
        height: 700,
        focused: true,
      });
    }
  },
  {
    id: "smmry",
    title: "記事を要約(Smmry.com)",
    contexts: ["page"],
    url: "https://smmry.com/%u#&SM_LENGTH=10",
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
    id: "powert",
    title: "Powere Thesaurus",
    contexts: ["selection"],
    url: "https://www.powerthesaurus.org/%s/synonyms",
  },
  {
    id: "ud",
    title: "Urban Dictionary",
    url: "https://www.urbandictionary.com/define.php?term=%s",
    contexts: ["selection"],
  },
  {
    id: "sc",
    title: "Scrapbox",
    contexts: ["selection"],
    url: "https://scrapbox.io/english-idioms/search/page?q=%s",
  },
  {
    id: "keep",
    title: "Keep",
    contexts: ["selection"],
    url: "https://keep.google.com/#search/text%253D%s",
  },
  {
    id: "sep2",
    type: 'separator',
    contexts: ["selection"],
  },
  {
    id: "wordsketch",
    title: "Word Sketch",
    contexts: ["selection"],
    url: "https://skell.sketchengine.co.uk/run.cgi/wordsketch?lpos=&query=%s",
  },
  {
    id: "hc",
    title: "Hyper Collocation",
    contexts: ["selection"],
    url: "https://hypcol.marutank.net/ja/?d=f&q=%s",
  },
];