import './popup.css';

const addStackSpace = document.getElementById("addStackSpace");
const addTextArea = document.getElementById("addTextArea");
const textarea = document.getElementById("addStackText");
const footer = document.getElementsByTagName("footer")[0];
const resetBtn = document.getElementById('resetBtn');
const list = document.getElementsByClassName('itemlist')[0];

const createItem = item => {
  const html = `
  <li>${item}</li>
  `;

  list.innerHTML += html;
  // ########## 追加 ###########
  //  saveTaskToLocalStorage(item, html);
}

let stayingList = [];

(function () {
  document.addEventListener('DOMContentLoaded', function restoreItemList() {
    stackStorage.get(raw => {
      if (typeof raw === "undefined") {
        stackStorage.reset();
      } else {
        stayingList = JSON.parse(raw);
        stayingList.forEach(res => {
          createItem(res.text);
        });

      }
    });
  });

  // initialize eventListeners
  textarea.addEventListener("keyup", (e) => {
    if (e.keyCode === 13) {
      updateStack({
        text: textarea.value,
      });
      createItem(textarea.value);
      textarea.value = "";
      return false;
    }
  });

  resetBtn.addEventListener('click', () => {
    stackStorage.reset();
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }
    textarea.value = "";
  });

})();

function updateStack({
  text = "",
  url = ""
}) {
  stackStorage.get(raw => {
    stayingList.push({
      text,
      url
    });
    stackStorage.set(JSON.stringify(stayingList));
  });
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