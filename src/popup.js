import './popup.css';

const addStackSpace = document.querySelector("#addStackSpace");
const addTextArea = document.querySelector("#addTextArea");
const textarea = document.querySelector("#addStackText");
const footer = document.getElementsByTagName("footer")[0];
const resetBtn = document.querySelector('#resetBtn');
const itemListDOM = document.querySelector('.itemlist');
const searchbox = document.querySelector('#searchbox');

let itemList = [];

const updateItemListDOM = item => {
  const html = `
  <li class="shrinkByWidth">${item}</li>
  `;
  itemListDOM.innerHTML += html;

  // increase the hight to avoid overflow
  let lastChild = itemListDOM.lastElementChild;

  while (isOverflown(lastChild)) {
    let replacement = document.createElement('li');
    replacement.innerHTML = lastChild.innerHTML;
    replacement.style.height = lastChild.offsetHeight + 10 + "px";
    itemListDOM.removeChild(lastChild);
    itemListDOM.appendChild(replacement);
    lastChild = replacement;
  }
}

const isOverflown = ({
  clientWidth,
  clientHeight,
  scrollWidth,
  scrollHeight
}) => {
  return scrollHeight > clientHeight || scrollWidth > clientWidth;
}

function updateStack(text) {
  itemList.push({
    text,
  });
  stackStorage.set(JSON.stringify(itemList));
};


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

})();

searchbox.addEventListener('keyup', () => {
  // 空白削除かつ、小文字に変換(大文字・小文字の区別をなくす)
  const term = searchbox.value.trim().toLowerCase();
  filterTasks(term);
})

// initialize eventListeners
textarea.addEventListener("keyup", (e) => {
  if (e.keyCode === 13) {
    const item = textarea.value.trim();
    updateStack(item);
    updateItemListDOM(item);
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

const filterTasks = (term) => {
  Array.from(itemListDOM.children)
    .filter((item) => !item.textContent.toLowerCase().includes(term))
    .forEach((item) => item.classList.add('filtered'));

  Array.from(itemListDOM.children)
    .filter((item) => item.textContent.toLowerCase().includes(term))
    .forEach((item) => item.classList.remove('filtered'));
};

const stackStorage = {
  get: callback => {
    chrome.storage.sync.get(['raw'], result => {
      callback(result.raw);
    });
  },
  set: (value) => {
    chrome.storage.sync.set({
      raw: value,
    });
  },
  reset: () => {
    chrome.storage.sync.set({
      raw: '[]'
    });
  }
};