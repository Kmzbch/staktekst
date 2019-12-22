import './popup.css';

const header = document.querySelector('header');
const footer = document.querySelector('footer');
const searchbox = document.querySelector('.searchbox');
const searchCancelBtn = document.querySelector('.search-cancel');
const headerBoard = document.querySelector('.header-board');
const textareaOpener = document.querySelector('.opener');
const sortBy = document.querySelector('.sort-by');
const textarea = document.querySelector('.add-textitem');
const stackDOM = document.querySelector('.textstack');
const resetBtn = document.querySelector('.resetBtn');

let stack = [];

/* module-specific utilities */
function updateStackDOM(content, footnote) {
  const {
    url,
    title
  } = footnote;
  const MAX_LENGTH = containsJapanese(title) ? 25 : 40;
  const abbreviation = title.length > MAX_LENGTH ? `${title.substring(0, MAX_LENGTH)}...` : title;
  const template = `
    <li>
    ${content}
    <i class="material-icons checkbox">check</i>
    <div class="spacer">
    <div class="footnote">
    </div>
    </li>
    `;

  stackDOM.innerHTML += template;

  // increase the hight to avoid overflow
  let lastTextItem = stackDOM.lastElementChild;

  while (isOverflown(lastTextItem)) {
    let replacement = document.createElement('li');
    replacement.innerHTML = lastTextItem.innerHTML;
    replacement.style.height = lastTextItem.offsetHeight + 10 + "px";
    stackDOM.removeChild(lastTextItem);
    stackDOM.appendChild(replacement);
    lastTextItem = replacement;
  }

  // consider text item without url as a note
  if (url) {
    lastTextItem.className += "clip";
    lastTextItem.querySelector('.footnote').innerHTML = `<a href="${url}" target="_blank">${abbreviation}</a>`;
  } else {
    lastTextItem.className += "note";
    lastTextItem.querySelector('.footnote').innerHTML = `#note`;
  }
}

function switchSortOrder({
  byNew = true
}) {
  if (byNew) {
    sortBy.innerHTML = 'New <i class="material-icons">arrow_upward</i>';
    stackDOM.style.flexDirection = 'column-reverse';
  } else {
    sortBy.innerHTML = 'Old <i class="material-icons">arrow_downward</i>';
    stackDOM.style.flexDirection = 'column';
  }
}

function addItemToStack(content) {
  stack.push({
    content: content,
    date: formatDate(),
    footnote: {
      title: "",
      url: ""
    }
  });

  stackStorage.set(JSON.stringify(stack));
};

function filterTextItems(term) {
  let termRegex;
  let hits = 0;

  if (containsJapanese(term)) {
    termRegex = new RegExp(`(${escapeRegExp(term)})(.*?)`, 'ig');
  } else {
    termRegex = new RegExp(`\\b(${escapeRegExp(term)})(.*?)\\b`, 'ig');
  }

  Array.from(stackDOM.children)
    .map(item => {
      item.innerHTML = removeHighlight(item.innerHTML);
      if (item.textContent.match(termRegex)) {
        item.classList.remove('filtered');
        hits++;
      } else {
        item.classList.add('filtered');
      }
      return item;
    })
    .filter(item => !item.classList.contains('filtered'))
    .forEach(item => {
      if (term.length >= 1) {
        let endIndex = item.innerHTML.search(/<i class="material-icons checkbox">check<\/i>/i);
        let textContent = item.innerHTML.substring(0, endIndex);
        let cutoff = item.innerHTML.substring(endIndex, item.innerHTML.length)
        item.innerHTML = addHighlight(textContent, termRegex) + cutoff;
      }
    });

  headerBoard.textContent = hits === 0 ? 'No Results' : `${hits} of ${stackDOM.children.length}`;
};

/* initializer */
const restoreTextStack = () => {
  stackStorage.get(raw => {
    if (typeof raw === 'undefined') {
      stackStorage.reset();
    } else {
      stack = JSON.parse(raw);
      stack.forEach(res => {
        updateStackDOM(res.content, res.footnote);
      });
    }
  });
};

const initializeEventListeners = () => {
  window.onscroll = () => {
    // show header and footer when scroll to the top/bottom
    if (window.pageYOffset == 0) {
      header.style.opacity = '1';
      footer.style.opacity = '1';
    } else if (document.body.offsetHeight + window.scrollY >= document.body.scrollHeight) {
      header.style.opacity = '1';
      footer.style.opacity = '1';
    } else {
      header.style.opacity = '0';
      footer.style.opacity = '0';
    }
  }

  /* searchbox */
  searchbox.addEventListener('input', (e) => {
    const term = searchbox.value.trim().toLowerCase();
    filterTextItems(term);

    // change styles on search
    if (term) {
      searchCancelBtn.style = 'display: block !important';
      footer.style.display = 'none';
    } else {
      searchCancelBtn.style = 'display: none !important';
      footer.style.display = 'block';
      headerBoard.textContent = '';
    }
  });

  searchbox.addEventListener('keydown', (e) => {
    if (e.keyCode === 38) {
      // up
      switchSortOrder({
        byNew: true
      });
    } else if (e.keyCode === 40) {
      // down
      switchSortOrder({
        byNew: false
      });
    }
  });

  searchCancelBtn.addEventListener('click', () => {
    searchbox.value = "";
    searchbox.dispatchEvent(new Event('input'));
  })

  /* add-sort container */
  textareaOpener.addEventListener('click', () => {
    textareaOpener.style.display = 'none';
    sortBy.style.display = 'none';
    textarea.style.display = 'flex';
    textarea.focus();
  });

  /* textarea */
  textarea.addEventListener('focus', (e) => {
    if (!headerBoard.classList.contains('entering')) {
      headerBoard.classList.add('entering');
    }
    let info = extractTextInfo(e.target.value);
    headerBoard.innerHTML = `${info.wordCount} words<span class="inlineblock">${info.charCount} chars</span>`;
  });

  textarea.addEventListener('input', (e) => {
    if (!headerBoard.classList.contains('entering')) {
      headerBoard.classList.add('entering');
    }
    let info = extractTextInfo(e.target.value);
    headerBoard.innerHTML = `${info.wordCount} words<span class="inlineblock">${info.charCount} chars</span>`;
  })

  textarea.addEventListener('focusout', () => {
    if (headerBoard.classList.contains('entering')) {
      headerBoard.classList.remove('entering');
    }
    headerBoard.textContent = "";
    textareaOpener.style.display = 'block';
    sortBy.style.display = 'inline-flex';
    textarea.style.display = 'none';
  });

  textarea.addEventListener('keyup', (e) => {
    if (e.keyCode === 13) {
      let text = textarea.value.trim();
      let footnote = {
        title: "",
        url: ""
      };

      addItemToStack(text);
      updateStackDOM(text, footnote);

      headerBoard.classList.remove('entering');
      headerBoard.textContent = "Item Added!";
      textarea.value = '';

      return false;
    }
  });

  /* sort by */
  sortBy.addEventListener('click', () => {
    switchSortOrder({
      byNew: !sortBy.innerHTML.includes('New')
    })
  });

  /* checkboxes for text stack */
  stackDOM.addEventListener('mouseover', () => {
    textarea.style.display = 'none';
    textareaOpener.style.display = 'inline';
    sortBy.style.display = 'inline-flex';
  });

  stackDOM.addEventListener('click', e => {
    if (e.target.classList.contains('checkbox')) {
      const parent = e.target.parentElement;

      // apply visual effects for removing text items
      e.target.style = 'color: white !important;';
      parent.style.color = 'black !important'
      parent.style.opacity = '0.5';
      parent.style.textDecoration = 'line-through';
      headerBoard.textContent = "Item Removed!";

      // remove
      setTimeout(() => {
        const lists = Array.from(stackDOM.querySelectorAll("li"));
        let index = lists.indexOf(e.target.parentElement);
        removeItemFromStorage(index);
        parent.remove();
        setTimeout(() => {
          headerBoard.textContent = "";
        }, 700);
      }, 450);
    }
  });

  // to do: title form
  // stackDOM.addEventListener('dblclick', e => {
  //   if (e.target.classList.contains('clip')) {
  //     let titleInput = document.createElement('input');
  //     titleInput.setAttribute('type', 'text');
  //     titleInput.setAttribute('class', 'title-input');
  //     let temp = '<input type="text" class="title-input">';
  //     e.target.insertAdjacentHTML('afterbegin', temp);
  //     titleInput.focus();
  //   }
  // });

  resetBtn.addEventListener('click', () => {
    stackStorage.reset();
    while (stackDOM.firstChild) {
      stackDOM.removeChild(stackDOM.firstChild);
    }
    textarea.value = '';
    stack = [];
  });
}

/* local storage */
const removeItemFromStorage = (index) => {
  stack.splice(index, 1);
  stackStorage.set(JSON.stringify(stack));
}

const stackStorage = {
  get: callback => {
    chrome.storage.local.get(['raw'], result => {
      callback(result.raw);
    });
  },
  set: (value) => {
    chrome.storage.local.set({
      raw: value,
    });
  },
  reset: () => {
    chrome.storage.local.set({
      raw: '[]'
    });
  }
};

/* utilities */
// text processiong
function escapeRegExp(string) {
  const reRegExp = /[\\^$.*+?()[\]{}|]/g,
    reHasRegExp = new RegExp(reRegExp.source);

  return (string && reHasRegExp.test(string)) ?
    string.replace(reRegExp, '\\$&') :
    string;
}

function extractTextInfo(text) {
  let charCount = text.length;
  let wordCount = charCount === 0 ? 0 : text.split(' ').length;
  return {
    charCount: charCount,
    wordCount: wordCount
  };
}

function containsJapanese(string) {
  return string.match(/[\u30a0-\u30ff\u3040-\u309f\u3005-\u3006\u30e0-\u9fcf]+?/) ? true : false
}

function formatDate(date = new Date()) {
  let yyyy = date.getFullYear();
  let mm = date.getMonth() + 1;
  let dd = date.getDate();

  if (mm < 10) {
    mm = '0' + mm;
  }
  if (dd < 10) {
    dd = '0' + dd;
  }

  return `${yyyy}-${mm}-${dd}`;
}

// DOM operation
function isOverflown({
  clientWidth,
  clientHeight,
  scrollWidth,
  scrollHeight
}) {
  return scrollHeight > clientHeight || scrollWidth > clientWidth;
}

function removeHighlight(html) {
  return html.replace(/<span class="highlighted">(.*?)<\/span>/g, '$1');
}

function addHighlight(html, regex) {
  return html.replace(regex, "<span class='highlighted'>$1</span>$2");
}

document.addEventListener('DOMContentLoaded', () => {
  restoreTextStack()
  initializeEventListeners();
});