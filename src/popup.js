import './popup.css';

const addStackSpace = document.querySelector("#addStackSpace");
const addTextArea = document.querySelector("#addTextArea");
const textarea = document.querySelector("#addStackText");
const footer = document.getElementsByTagName("footer")[0];
const resetBtn = document.querySelector('#resetBtn');
const itemListDOM = document.querySelector('.itemlist');
const searchbox = document.querySelector('.searchbox');

let itemList = [];

const updateItemListDOM = (item, url = "", title = "") => {
  // listitem template
  // const html = `
  // <li>
  // <span>${item}</span>
  // <a class="source" href="${url}" target="_blank">${title}</a>
  // </li>
  // `;
  const html = `
  <li>
  ${item}
  </li>
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

  // aTag.setAttribute("class", "source");
  // aTag.setAttribute("href", url);
  // aTag.setAttribute("target", "_blank");
  // aTag.innerText = title;
  // itemListDOM.lastElementChild.appendChild(aTag);

}


const isOverflown = ({
  clientWidth,
  clientHeight,
  scrollWidth,
  scrollHeight
}) => {
  return scrollHeight > clientHeight || scrollWidth > clientWidth;
}

function updateStack(text, url = "", title = "") {
  itemList.push({
    text,
    url,
    title
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
          console.log(res.title);
          updateItemListDOM(res.text, res.url, res.title);
        });
      }
    });
  });
})();


const searchCancelButton = document.querySelector('.searchCancelButton');

searchCancelButton.addEventListener("click", () => {
  searchbox.value = "";
  // fire event
  let event = new Event('input');
  searchbox.dispatchEvent(event);
})

searchbox.addEventListener('input', () => {
  const term = searchbox.value.trim().toLowerCase();

  if (term === "") {
    searchCancelButton.style = "display: none !important;";
  } else {
    searchCancelButton.style = "display: block !important;";
  }

  filterItems(term);
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

textarea.addEventListener('focusout', (e) => {
  textarea.style.display = "none";
  addTextArea.style.display = "block";
});
addTextArea.addEventListener('click', () => {
  textarea.style.display = "flex";
  textarea.focus();
  addTextArea.style.display = "none";
});

resetBtn.addEventListener('click', () => {
  stackStorage.reset();
  while (itemListDOM.firstChild) {
    itemListDOM.removeChild(itemListDOM.firstChild);
  }
  textarea.value = "";
  itemList = [];
});

var reRegExp = /[\\^$.*+?()[\]{}|]/g,
  reHasRegExp = new RegExp(reRegExp.source);

function escapeRegExp(string) {
  return (string && reHasRegExp.test(string)) ?
    string.replace(reRegExp, '\\$&') :
    string;
}

const filterItems = (term) => {
  // /\b(what you're).*?\b/ig
  Array.from(itemListDOM.children).forEach(item => {
    item.innerHTML = item.innerHTML.replace(/(<span class="highlight">|<\/span>)/g, '');
    console.log(item.innerHTML);
  });

  let regexp = new RegExp('\\b(' + escapeRegExp(term) + ')(.*?)\\b', 'ig');
  Array.from(itemListDOM.children)
    .filter((item) => !item.textContent.match(regexp))
    .forEach((item) => item.classList.add('filtered'));

  Array.from(itemListDOM.children)
    .filter((item) => item.textContent.match(regexp))
    .forEach((item) => {
      item.classList.remove('filtered');
      if (term.length >= 1) {
        item.innerHTML = item.innerHTML.replace(regexp, "<span class='highlight'>$1</span>$2");
      }
    });
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