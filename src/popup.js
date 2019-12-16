import './popup.css';

const addStackSpace = document.querySelector("#addStackSpace");
const addTextArea = document.querySelector("#addTextArea");
const textarea = document.querySelector("#addStackText");
const footer = document.getElementsByTagName("footer")[0];
const resetBtn = document.querySelector('#resetBtn');
const itemListDOM = document.querySelector('.itemlist');

let itemList = [];

const updateItemListDOM = item => {
  const html = `
  <li>${item}</li>
  `;

  itemListDOM.innerHTML += html;
}

(function () {
  document.addEventListener('DOMContentLoaded', function restoreItemList() {
    stackStorage.get(raw => {
      if (typeof raw === "undefined") {
        stackStorage.reset();
      } else {
        itemList = JSON.parse(raw);
        itemList.forEach(res => {
          updateItemListDOM(res.text);
        });
      }
    });
  });

  // initialize eventListeners
  textarea.addEventListener("keyup", (e) => {
    if (e.keyCode === 13) {
      updateStack(textarea.value);
      updateItemListDOM(textarea.value);
      textarea.value = "";
      return false;
    }
  });

  resetBtn.addEventListener('click', () => {
    stackStorage.reset();
    while (itemListDOM.firstChild) {
      itemListDOM.removeChild(itemListDOM.firstChild);
    }
    textarea.value = "";
    itemList = [];
  });

})();


function updateStack(text) {
  itemList.push({
    text,
  });
  stackStorage.set(JSON.stringify(itemList));
};

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
  },
  reset: () => {
    chrome.storage.sync.set({
      raw: '[]'
    });
  }
};