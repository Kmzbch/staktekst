let words = null;

// receive message from contentScript.ks
chrome.runtime.onMessage.addListener(getMessage);

function getMessage(request, sender, sendResponse) {
  sendResponse({
    text: words
  });
}

// const req = new XMLHttpRequest();
// console.log(req);


chrome.contextMenus.onClicked.addListener((menuInfo, tab) => {
  console.log(tab);
  chrome.tabs.sendMessage(tab.id, {
    /* message: "additional message here" */
  }, response => {
    words = response.selection;
    switch (menuInfo.menuItemId) {
      case "mirai":
        chrome.tabs.create({
          url: "https://miraitranslate.com/en/trial/"
        });
        break;
      case "odd":
        chrome.tabs.create({
          url: "http://www.oddcast.com/ttsdemo/index.php"
        });
        break;
      case "youglish":
        chrome.windows.create({
          url: "https://youglish.com/search/" + words,
          type: "popup",
          width: 480,
          height: 700,
          focused: true,
        });
        break;
      case "smmry":
        // chrome.windows.create({
        //   url: "https://smmry.com/" + tab.url + '#&SM_LENGTH=10',
        //   type: "popup",
        //   width: 480,
        //   height: 700,
        //   focused: true,
        // });
        chrome.tabs.create({
          url: "https://smmry.com/" + tab.url + '#&SM_LENGTH=10',
        });

        break;
      case "dopeoplesayit":
        chrome.tabs.create({
          url: "https://dopeoplesay.com/q/" + words,
        });
        break;

      case "skell":
        chrome.tabs.create({
          url: "https://skell.sketchengine.co.uk/run.cgi/concordance?lpos=&query=" + words,
        });
        break;
      case "twitter":
        chrome.tabs.create({
          url: "https://twitter.com/search?q=" + words,
        });
        break;
      case "vocabulary":
        chrome.tabs.create({
          url: "https://www.vocabulary.com/dictionary/" + words,
          //          url: "https://www.vocabulary.com/dictionary/definition.ajax?search=" + words,
        });
        break;
      case "powert":
        chrome.tabs.create({
          url: "https://www.powerthesaurus.org/" + words + "/synonyms",
        });
        break;
      case "ud":

        chrome.tabs.create({
          url: "https://www.urbandictionary.com/define.php?term=" + words,
        });
        break;
      case "sc":
        chrome.tabs.create({
          url: "https://scrapbox.io/english-idioms/search/page?q=" + words,
        });
        break;
      case "keep":
        chrome.tabs.create({
          url: "https://keep.google.com/#search/text%253D" + words,
        });
        break;
      case "wordsketch":
        chrome.tabs.create({
          url: "https://skell.sketchengine.co.uk/run.cgi/wordsketch?lpos=&query=" + words,
        });
        break;
      case "hc":
        chrome.tabs.create({
          url: "https://hypcol.marutank.net/ja/?d=f&q=" + words,
        });
        break;
      case "extendedcopy":
        copyTextWithTitleUrl(words, tab.title, tab.url);
        break;
      default:
        break;
    }

  });
});

function copyTextWithTitleUrl(text, title, url) {
  var copyFrom = document.createElement("textarea");
  copyFrom.textContent = text + "\n\n" + title + "\n" + url;
  document.body.appendChild(copyFrom);
  copyFrom.select();
  document.execCommand('copy');
  copyFrom.blur();
  document.body.removeChild(copyFrom);
}



chrome.contextMenus.removeAll(() => {
  chrome.contextMenus.create({
    title: "記事を要約(Smmry.com)",
    id: "smmry",
    contexts: ["page"]
  });
  chrome.contextMenus.create({
    title: "みらい翻訳（英→日）",
    id: "mirai",
    contexts: ["selection"]
  });
  chrome.contextMenus.create({
    title: "A Jump to the Sky Turns to a Riderkick",
    id: "odd",
    contexts: ["selection"]
  });
  chrome.contextMenus.create({
    title: "URL付きでコピー",
    id: "extendedcopy",
    contexts: ["selection"],
  });
  chrome.contextMenus.create({
    type: 'separator',
    contexts: ["selection"],
    id: "sep1"
  });
  chrome.contextMenus.create({
    title: "Do People Say It",
    id: "dopeoplesayit",
    contexts: ["selection"]
  });
  chrome.contextMenus.create({
    title: "Youglish",
    id: "youglish",
    contexts: ["selection"]
  });
  chrome.contextMenus.create({
    title: "SKELL",
    id: "skell",
    contexts: ["selection"],
  });
  chrome.contextMenus.create({
    title: "Twitter",
    id: "twitter",
    contexts: ["selection"],
  });
  chrome.contextMenus.create({
    title: "Scrapbox",
    id: "sc",
    contexts: ["selection"],
  });
  chrome.contextMenus.create({
    title: "Keep",
    id: "keep",
    contexts: ["selection"],
  });
  chrome.contextMenus.create({
    type: 'separator',
    contexts: ["selection"],
    id: "sep2"
  });
  chrome.contextMenus.create({
    title: "Vocabulary.com",
    id: "vocabulary",
    contexts: ["selection"],
  });
  chrome.contextMenus.create({
    title: "Powere Thesaurus",
    id: "powert",
    contexts: ["selection"],
  });
  chrome.contextMenus.create({
    title: "Urban Dictionary",
    id: "ud",
    contexts: ["selection"],
  });
  chrome.contextMenus.create({
    title: "Word Sketch",
    id: "wordsketch",
    contexts: ["selection"],
  });
  chrome.contextMenus.create({
    title: "Hyper Collocation",
    id: "hc",
    contexts: ["selection"],
  });

});