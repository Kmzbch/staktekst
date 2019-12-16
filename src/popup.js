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

})();

// // 削除機能
// list.addEventListener('click', e => {
//   if (e.target.classList.contains('delete')) {
//       e.target.parentElement.remove();
//       // ########## 追加 ###########
//       const task = e.target.parentElement.textContent.trim()
//       deleteTaskFromLocalStorage(task);
//   }
// });
// const deleteTaskFromLocalStorage = task => {
//   localStorage.removeItem(task);
//   return;
// }

const filterTasks = (term) => {
  Array.from(itemListDOM.children)
    .filter((todo) => !todo.textContent.toLowerCase().includes(term))
    .forEach((todo) => todo.classList.add('filtered'));

  Array.from(itemListDOM.children)
    .filter((todo) => todo.textContent.toLowerCase().includes(term))
    .forEach((todo) => todo.classList.remove('filtered'));
};

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