import './popup.css';
import * as bubble_lib from './bubble_lib.js';
import {
  escapeRegExp,
  copyTextWithTitleUrl,
  extractTextInfo,
  containsJapanese,
  formatDate,
  adjustDOMHeight as fitDOMHeightToContent
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
const tagarea = document.querySelector('#tagarea');

const modal = document.querySelector('.modal');
const messagebox = document.querySelector('#messagebox');
const overlay = document.querySelector('.overlay');
const reset = document.querySelector('#reset');
const cancel = document.querySelector('#cancel')

let stack = [];
let tagStack = ['note', 'clip'];
let dateStack = [];

let textHolder = '';
let tagsHolder = [];
let timer = null;

let background = chrome.extension.getBackgroundPage();

/* switches */
const switchViewStyles = () => {
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
  toolBox.style.display = 'none';
  textareaOpener.style.display = 'none';
  sortBySwitcher.style.display = 'none';
  // open textarea
  textarea.style.display = 'flex';
  tagarea.style.display = 'flex';
  textarea.focus();
}

const closeAddTextItemForm = () => {
  headerBoard.classList.remove('entering');
  headerBoard.textContent = '';

  toolBox.style.display = 'flex';
  textareaOpener.style.display = 'block';
  sortBySwitcher.style.display = 'inline-block';
  // hide form
  textarea.style.display = 'none';
  tagarea.style.display = 'none';
}

const updateHeaderBoard = () => {
  toolBox.style.display = 'none';

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
      .filter(textItem => !textItem.classList.contains('date'))
      .map(textItem => {
        // remove text decoration and highlight
        textItem.firstChild.innerHTML = textItem.firstChild.innerText;
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
        let contentDIV = textItem.firstElementChild;
        // add highlight when searching
        if (term.length >= 1) {
          contentDIV.innerHTML = contentDIV.textContent.replace(termRegex, "<span class='highlighted'>$1</span>$2");

        }
        // urls can be hit without highlight
        if (contentDIV.textContent.match(/(https?:\/\/[^\s]+)/g)) {
          contentDIV.innerHTML = contentDIV.textContent.replace(/(https?:\/\/[^\s]+)/g, "<a class='emphasized' href='$1' target='_blank'>$1</a>");
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

  removeHashTags();


  textarea.value = '';
  searchbox.value = '';
  stack = [];
  dateStack = [];
  tagStack = ['note'];
  textHolder = '';
  tagsHolder = [];

  closeAddTextItemForm();
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

  const template = `<div class="stackwrapper"><div class='content'>${content}</div><i class="material-icons checkbox">check</i><div class="spacer"></div><div class="footnote"></div></div>`;

  stackDOM.innerHTML += template;

  // consider text item without url as a note
  let lastTextItem = stackDOM.lastElementChild;

  // 
  let contentDIV = lastTextItem.firstElementChild;
  contentDIV.innerHTML = contentDIV.textContent.replace(/(https?:\/\/[^\s]+)/g, "<a href='$1' target='_blank'>$1</a>");

  if (url) {
    lastTextItem.classList.add('clip');
    lastTextItem.querySelector('.footnote').innerHTML = `<span class="tag hidden">#clip</span><a href="${url}" target="_blank">${pageTitle}</a>`;
    // lastTextItem.querySelector('.footnote').innerHTML = `<span class="tag">#clip</span><a class='source' href="${url}" target="_blank">${pageTitle}</a>`;

  } else {
    lastTextItem.classList.add('note');
    lastTextItem.querySelector('.footnote').innerHTML = `<span class="tag">#note</span>`;
  }
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

const removeHashTags = () => {
  let removedTags = [];
  while (tagarea.lastChild && tagarea.children.length > 1) {
    removedTags.push(tagarea.lastChild.innerText);
    tagarea.removeChild(tagarea.lastChild);
  }
  return removedTags;
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
  tagarea.appendChild(tagItem);
  tagsHolder.push(tagName);
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

  viewSwitcher.addEventListener('click', switchViewStyles);

  /* add-sort container */
  textareaOpener.addEventListener('mouseover', switchTextAreaOpenerIcons);

  textareaOpener.addEventListener('mouseout', switchTextAreaOpenerIcons);

  textareaOpener.addEventListener('click', openAddTextItemForm);

  sortBySwitcher.addEventListener('click', switchSortOrder);

  /* textarea */
  textarea.addEventListener('focus', () => {
    updateHeaderBoard();

    // add search query of hashtag 
    if (searchbox.value !== '') {
      removeHashTags();
      addNewTagItem(searchbox.value);
    }
  })

  textarea.addEventListener('input', (e) => {
    // reset if timeout remains
    if (timer) {
      clearTimeout(timer)
    }


    const MIN_HEIGHT = 25;

    fitDOMHeightToContent(textarea, MIN_HEIGHT);

    let errClass = tagarea.querySelector('.error');
    if (errClass !== null) {
      errClass.parentElement.removeChild(errClass);
    }

    let hashtags = e.target.value.match(/(^|\s)((#|＃)[^\s]+)(\s$|\n)/);

    if (hashtags !== null) {
      let regex = new RegExp(`(^|\\s)${escapeRegExp(hashtags[2])}(\\s$|\\n)`);
      let tagsAdded = tagarea.querySelectorAll('.hashtag').length;

      if (tagsAdded >= 5) {
        let errMessage = document.createElement('span');
        errMessage.className = 'error';
        errMessage.textContent = 'タグは最大5個まで';
        tagarea.appendChild(errMessage);
      } else {
        e.target.value = e.target.value.replace(regex, '')
        if (hashtags) {
          addNewTagItem(hashtags[2])
        }
      }
    }

    textHolder = e.target.value.trim();

    updateHeaderBoard();
  })

  textarea.addEventListener('keyup', (e) => {
    if (e.keyCode === 13) {
      let errClass = tagarea.querySelector('.error');

      if (errClass === null) {
        let text = textarea.value.trim();
        if (text === '' || text === '\n') {
          textarea.value = '';
          return false;
        }

        let hashtags = removeHashTags();

        let footnote = {
          pageTitle: "",
          url: "",
          hashtag: hashtags
        };

        addTextItemToStack(text, footnote);
        renderTextItem(text, footnote);

        // display message
        headerBoard.classList.remove('entering');
        headerBoard.textContent = "Item Added!";
        timer = setTimeout(() => {
          headerBoard.textContent = '';
          toolBox.style.display = 'flex';
        }, 700);

        // clear form and holders
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

  overlay.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  reset.addEventListener('click', (e) => {
    resetAll();
    overlay.click();
  })

  cancel.addEventListener('click', (e) => {
    overlay.click();
  })

  /* reset button */
  // resetBtn.addEventListener('click', resetAll);
  resetBtn.addEventListener('click', () => {
    document.querySelector('.modal').classList.remove('hidden');
  });


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
    if (typeof res.tags !== 'undefined') {
      res.tags.forEach(tag => {
        addNewTagItem(tag);
      })
    }
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

// initialize
document.addEventListener('DOMContentLoaded', () => {
  renderStack();
  restoreTextArea();
  initializeEventListeners();

  // workaround to avoid displaying view switcher delay
  switchViewStyles();

  // attach bubbleDOM
  document.addEventListener('mouseup', bubble_lib.renderBubble);
});