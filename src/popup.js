import './popup.css';
import * as bubble_lib from './bubble_lib.js';
import {
  escapeRegExp,
  copyTextWithTitleUrl,
  extractTextInfo,
  containsJapanese,
  formatDate,
  adjustDOMHeight
} from './common_lib.js';

const header = document.querySelector('header');
const footer = document.querySelector('footer');
const searchbox = document.querySelector('.searchbox');
const searchCancelBtn = document.querySelector('.search-cancel');
const headerBoard = document.querySelector('.header-board');
const toolBox = document.querySelector('#toolbox');
const topOpener = document.querySelector('.opener-top');
const viewSwitcher = document.querySelector('.switchview');

const textareaOpener = document.querySelector('.opener');
const sortBySwitcher = document.querySelector('.sort-by');
const textarea = document.querySelector('.add-textitem');
const stackDOM = document.querySelector('.textstack');
const resetBtn = document.querySelector('.resetBtn');
const tagArea = document.querySelector('#tagarea');

let stack = [];
let tagStack = ['note'];
let dateStack = [];

let textHolder = '';
let tagsHolder = [];
let timer = null;

let background = chrome.extension.getBackgroundPage();

/* switches */
const switchStyles = () => {
  let defaultview = document.querySelector('#style_default');
  let listview = document.querySelector('#style_listview');

  if (defaultview.disabled) {
    defaultview.disabled = false;
    listview.disabled = true;
    viewSwitcher.textContent = 'reorder';
    switchSortOrder({
      byNew: true
    });
  } else {
    defaultview.disabled = true;
    listview.disabled = false;
    viewSwitcher.textContent = 'format_list_bulleted';
    switchSortOrder({
      byNew: false
    });
  }
}

const switchSortOrder = ({
  byNew = !sortBySwitcher.innerHTML.includes('New')
}) => {
  if (byNew) {
    sortBySwitcher.innerHTML = 'New <i class="material-icons">arrow_upward</i>';
    stackDOM.style.flexDirection = 'column-reverse';
  } else {
    sortBySwitcher.innerHTML = 'Old <i class="material-icons">arrow_downward</i>';
    stackDOM.style.flexDirection = 'column';
  }
}

const switchStickyVisibility = () => {
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

const switchTextAreaOpenerIcons = () => {
  if (textareaOpener.textContent === 'post_add') {
    textareaOpener.textContent = 'add';
  } else if (textareaOpener.textContent === 'add') {
    textareaOpener.textContent = 'post_add';
  }
}

const openAddTextItemForm = () => {
  updateHeaderBoard();
  toolBox.style.display = 'none';
  textareaOpener.style.display = 'none';
  sortBySwitcher.style.display = 'none';
  // open textarea
  textarea.style.display = 'flex';
  tagarea.style.display = 'flex';
  textarea.focus();
}

textarea.addEventListener('focus', () => {
  // add search query of hashtag 
  if (searchbox.value !== '') {
    while (tagArea.lastChild && tagArea.children.length > 1) {
      tagArea.removeChild(tagArea.lastChild);
    }
    addNewTagItem(searchbox.value);
  }
})

const closeAddTextItemForm = () => {
  if (headerBoard.classList.contains('entering')) {
    headerBoard.classList.remove('entering');
  }
  headerBoard.textContent = '';

  toolBox.style.display = 'flex';
  textareaOpener.style.display = 'block';
  sortBySwitcher.style.display = 'inline-block';
  // hide form
  textarea.style.display = 'none';
  tagarea.style.display = 'none';
}

const updateHeaderBoard = () => {
  if (!headerBoard.classList.contains('entering')) {
    headerBoard.classList.add('entering');
  }
  let info = extractTextInfo(textarea.value);
  headerBoard.innerHTML = `${info.wordCount} words<span class="inlineblock">${info.charCount} chars</span>`;
}

const updateSearchResult = (e) => {
  let term = e.target.value.trim().toLowerCase();
  let hits = filterTextItems(term);

  // change styles on search
  if (term) {
    searchCancelBtn.style = 'display: block !important';
    footer.style.display = 'none';
    toolBox.style.display = 'none';
    headerBoard.textContent = hits === 0 ? 'No Results' : `${hits} of ${stack.length}`;
  } else {
    searchCancelBtn.style = 'display: none !important';
    footer.style.display = 'block';
    toolBox.style.display = 'flex';
    headerBoard.textContent = '';
  }

  function filterTextItems(term) {
    let termRegex;
    let hits = 0;

    // Search in Japanese/English
    if (containsJapanese(term)) {
      termRegex = new RegExp(`(${escapeRegExp(term)})(.*?)`, 'ig');
    } else {
      termRegex = new RegExp(`\\b(${escapeRegExp(term)})(.*?)\\b`, 'ig');
    }

    Array.from(stackDOM.children)
      .map(textItem => {
        textItem.innerHTML = removeHighlight(textItem.innerHTML);
        if (textItem.textContent.match(termRegex)) {
          textItem.classList.remove('filtered');
          hits++;
        } else {
          textItem.classList.add('filtered');
        }
        return textItem;
      })
      .filter(textItem => !textItem.classList.contains('filtered'))
      .forEach(textItem => {
        if (term.length >= 1) {
          // exclude unnecessary elements and highlight the term
          let endIndex = textItem.innerHTML.search(/<i class="material-icons checkbox">check<\/i>/i);
          let textContent = textItem.innerHTML.substring(0, endIndex);
          let cutoff = textItem.innerHTML.substring(endIndex, textItem.innerHTML.length)

          textItem.innerHTML = addHighlight(textContent, termRegex) + cutoff;
        }
      });

    return hits;
  };
}

const resetAll = () => {
  stackStorage.reset();
  while (stackDOM.firstChild) {
    stackDOM.removeChild(stackDOM.firstChild);
  }
  textarea.value = '';
  searchbox.value = '';
  stack = [];
  dateStack = [];
  tagStack = ['note'];
  textHolder = '';
  tagsHolder = [];
}

// save text and hashtags in the textarea when closing
const saveAddItemForm = () => {
  background.chrome.storage.local.set({
    textarea: textHolder,
    tags: tagsHolder
  });
}

/* stack operation*/
const renderStack = () => {
  stackStorage.get(raw => {
    if (typeof raw === 'undefined') {
      stackStorage.reset();
    } else {
      stack = JSON.parse(raw);
      stack.forEach(res => {
        renderTextItem(res.content, res.footnote, res.date);
      });
      tagStack = tagStack.sort();
    }
  });
};

const renderTextItem = (content, footnote, date = formatDate()) => {
  const {
    pageTitle: pageTitle,
    url,
    hashtag: hashtag
  } = footnote;

  const template = `<div class="stackwrapper">${content}<i class="material-icons checkbox">check</i><div class="spacer"></div><div class="footnote"></div></div>`;

  stackDOM.innerHTML += template;

  // consider text item without url as a note
  let lastTextItem = stackDOM.lastElementChild;

  if (url) {
    lastTextItem.classList.add("clip");
    lastTextItem.querySelector('.footnote').innerHTML = `<a href="${url}" target="_blank">${pageTitle}</a>`;

  } else {
    lastTextItem.classList.add("note");
    lastTextItem.querySelector('.footnote').innerHTML = `<span class="tag">#note</span>`;
    if (typeof hashtag !== 'undefined') {
      hashtag.forEach(t => {
        let tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = '#' + t;
        lastTextItem.querySelector('.footnote').appendChild(tag);
        // tag stack
        let index = tagStack.indexOf(t);
        if (index === -1) {
          tagStack.push(t);
        }
      })
    }
  }

  // date
  let dateDiv = document.createElement('div');
  dateDiv.className = 'date';
  dateDiv.textContent = date;

  if (dateStack.length == 0) {
    stackDOM.insertBefore(dateDiv, lastTextItem);
    dateStack.push(date);
  } else {
    if (dateStack[dateStack.length - 1] !== date) {
      stackDOM.insertBefore(dateDiv, lastTextItem);
      dateStack.push(date);
    }
  }
}

const addTextItemToStack = (content, footnote = {}) => {
  stack.push({
    content: content,
    date: formatDate(),
    noteTitle: '',
    footnote: {
      pageTitle: '',
      url: '',
      hashtag: footnote.hashtag
    },
  });
  stackStorage.set(JSON.stringify(stack));
};

const removeTextItemFromStack = (index) => {
  stack.splice(index, 1);
  stackStorage.set(JSON.stringify(stack));
}

const addNewTagItem = (tagName) => {
  let tagItem = document.createElement('span');
  tagItem.classList.add('hashtag');
  tagItem.textContent = tagName.slice(1);
  tagItem.addEventListener('click', (e) => {
    e.target.parentElement.removeChild(e.target);
    let index = tagsHolder.indexOf(tagName);
    tagsHolder.splice(index, 1);
  });
  tagArea.appendChild(tagItem);
}

const initializeEventListeners = () => {
  /* window */
  window.onscroll = switchStickyVisibility;

  window.onunload = saveAddItemForm; // fired when popup.html closing

  /* search container */
  searchbox.addEventListener('input', updateSearchResult);

  searchbox.addEventListener('keyup', (e) => {
    // rotate search query of hashtags
    if (e.ctrlKey) {
      let tagQuery = '';
      if (e.keyCode === 38) {
        tagQuery = tagStack.pop();

        if (searchbox.value === '#' + tagQuery) {
          tagStack.unshift(tagQuery);
          tagQuery = tagStack.pop();
        }
        tagStack.unshift(tagQuery);
      } else if (e.keyCode === 40) {
        tagQuery = tagStack.shift();

        if (searchbox.value === '#' + tagQuery) {
          tagStack.push(tagQuery);
          tagQuery = tagStack.shift();
        }
        tagStack.push(tagQuery);
      }
      fireSearchWithQuery('#' + tagQuery);
    }
  })

  searchbox.addEventListener('focus', closeAddTextItemForm);

  searchCancelBtn.addEventListener('click', () => {
    fireSearchWithQuery('');
    searchbox.focus();
  })

  /* toolbox container */
  topOpener.addEventListener('click', () => {
    textareaOpener.dispatchEvent(new Event('click'));
  });

  viewSwitcher.addEventListener('click', switchStyles);

  // to-do: download btn

  /* add-sort container */
  textareaOpener.addEventListener('mouseover', switchTextAreaOpenerIcons);

  textareaOpener.addEventListener('mouseout', switchTextAreaOpenerIcons);

  textareaOpener.addEventListener('click', openAddTextItemForm);

  sortBySwitcher.addEventListener('click', switchSortOrder);

  /* textarea */
  textarea.addEventListener('input', (e) => {
    if (timer) {
      clearTimeout(timer)
    }

    adjustDOMHeight(textarea, 25);

    let err = tagArea.querySelector('.error');
    if (err !== null) {
      err.parentElement.removeChild(err);
    }

    let tags = e.target.value.match(/(^|\s)((#|＃)[^\s]+)(\s$|\n)/);

    if (tags !== null) {
      let regex = new RegExp(`(^|\\s)${escapeRegExp(tags[2])}(\\s$|\\n)`);
      let tagsAdded = tagarea.querySelectorAll('.hashtag').length;

      if (tagsAdded >= 5) {
        const errorMessage = document.createElement('span');
        errorMessage.className = 'error';
        errorMessage.textContent = 'タグは最大5個まで';

        tagarea.appendChild(errorMessage);
      } else {
        e.target.value = e.target.value.replace(regex, '')
        if (tags) {
          addNewTagItem(tags[2])
        }
      }
    }

    textHolder = e.target.value.trim();
    tagsHolder.push(tags[2]);

    updateHeaderBoard();
  })

  textarea.addEventListener('keyup', (e) => {
    if (e.keyCode === 13) {
      let err = tagArea.querySelector('.error');
      if (err === null) {
        let text = textarea.value.trim();
        if (text === '' || text === '\n') {
          textarea.value = '';
          return false;
        }

        let tagDOMs = tagArea.childNodes;
        let tags = []

        // exclude the first element
        for (let i = 1; i < tagDOMs.length; i++) {
          tags.push(tagDOMs[i].innerText);
        }

        let footnote = {
          pageTitle: "",
          url: "",
          hashtag: tags
        };

        addTextItemToStack(text, footnote);
        renderTextItem(text, footnote);

        while (tagArea.lastChild && tagArea.children.length > 1) {
          tagArea.removeChild(tagArea.lastChild);
        }

        headerBoard.classList.remove('entering');
        headerBoard.textContent = "Item Added!";
        timer = setTimeout(() => {
          headerBoard.textContent = '';
          toolBox.style.display = 'flex';
        }, 700);
        textarea.value = '';
        textHolder = '';
        tagsHolder = [];
        return false;
      }
    }
  });

  /* checkboxes for text stack */
  stackDOM.addEventListener('mouseover', closeAddTextItemForm)

  stackDOM.addEventListener('click', e => {
    // tag filter
    if (e.target.classList.contains('tag')) {
      fireSearchWithQuery(e.target.innerHTML);
    } else {
      if (e.target.classList.contains('checkbox')) {
        const parent = e.target.parentElement;

        // apply visual effects for removing text items
        e.target.style = 'color: white !important;';
        parent.style.color = 'black !important'
        parent.style.opacity = '0.5';
        parent.style.textDecoration = 'line-through';
        toolBox.style.display = 'none';
        headerBoard.textContent = "Item Removed!";

        // remove
        setTimeout(() => {
          let lists = Array.from(stackDOM.querySelectorAll('.stackwrapper'));
          let index = lists.indexOf(e.target.parentElement);

          removeTextItemFromStack(index);
          parent.remove();
          setTimeout(() => {
            headerBoard.textContent = '';
            toolBox.style.display = 'flex';
          }, 700);
        }, 450);
      }
    }

  });

  /* reset button */
  resetBtn.addEventListener('click', resetAll);

  /* inner functions */
  function fireSearchWithQuery(query) {
    searchbox.value = query;
    searchbox.dispatchEvent(new Event('input'));
  };
}

const restoreTextArea = () => {
  chrome.storage.local.get(['textarea', 'tags'], res => {
    textarea.textContent = res.textarea;
    textHolder = res.textarea;
    tagsHolder = res.tags;
    tagsHolder.forEach(tag => {
      addNewTagItem(tag);
    })
    chrome.storage.local.set({
      textarea: '',
      tags: []
    });
  })
}

/* local storage */
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

// DOM operation
const removeHighlight = (html) => {
  return html.replace(/<span class="highlighted">(.*?)<\/span>/g, '$1');
}

const addHighlight = (html, regex) => {
  return html.replace(regex, "<span class='highlighted'>$1</span>$2");
}

document.addEventListener('DOMContentLoaded', () => {
  renderStack();
  restoreTextArea();
  initializeEventListeners();

  // workaround to avoid displaying view switcher delay
  switchStyles();

  document.addEventListener('mouseup', bubble_lib.renderBubble);
});