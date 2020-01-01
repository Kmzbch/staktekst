import './popup.css';
import * as bubble_lib from './bubble_lib.js';
import {
  escapeRegExp,
  extractTextInfo,
  containsJapanese,
  formatDate,
  adjustDOMHeight as fitDOMHeightToContent
} from './common_lib.js';

/* header */
const header = document.querySelector('header');

// seachbox
const searchBox = document.querySelector('.searchbox');
const searchCancelButton = document.querySelector('.searchcancel-button');
const dropdownList = document.querySelector('#dropdownlist');

// toolbox
const toolbox = document.querySelector('#toolbox');
const topOpener = document.querySelector('.opener-top');
const viewSwitcher = document.querySelector('.switchview');
const fileExporter = document.querySelector('.fileexport');

// headerboard
const headerBoard = document.querySelector('.header-board');

/* main */
// textarea
const textareaOpener = document.querySelector('.opener');
const sortBySwitcher = document.querySelector('.sort-by');
const textarea = document.querySelector('.add-textitem');
const tagarea = document.querySelector('.tagarea');

// items
const stackDOM = document.querySelector('#textstack');

/* footer */
const footer = document.querySelector('footer');
const clearStackButton = document.querySelector('.clear-button');

/* stack clear modal */
const clearStackWindow = document.querySelector('#clear-window');
const messageBox = document.querySelector('.messagebox');
const overlay = document.querySelector('.overlay');
const confirmButton = document.querySelector('.ok');
const cancelButton = document.querySelector('.cancel')

// holder variables
let stack = [];
let tagStack = ['note', 'clip', 'bookmark'];
let dateStack = [];

let textHolder = '';
let tagsHolder = [];

let timer = null;
let background = chrome.extension.getBackgroundPage();

/* switches */

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

const switchViewStyles = () => {
  let defaultview = document.querySelector('#style_default');
  let listview = document.querySelector('#style_listview');

  if (defaultview.disabled) {
    switchSortOrder({
      byNew: true
    });

    defaultview.disabled = false;
    listview.disabled = true;
    viewSwitcher.textContent = 'reorder';
  } else {
    switchSortOrder({
      byNew: false
    });

    defaultview.disabled = true;
    listview.disabled = false;
    viewSwitcher.textContent = 'format_list_bulleted';
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

const switchTextareaOpenerIcons = () => {
  if (textareaOpener.textContent === 'post_add') {
    textareaOpener.textContent = 'add';
  } else if (textareaOpener.textContent === 'add') {
    textareaOpener.textContent = 'post_add';
  }
}

const openAddTextItemForm = () => {
  toolbox.classList.add('hidden');
  textareaOpener.classList.add('hidden');
  sortBySwitcher.classList.add('hidden');

  textarea.classList.remove('hidden');
  tagarea.classList.remove('hidden');

  textarea.focus();
}

const closeAddTextItemForm = () => {
  textarea.classList.add('hidden');
  tagarea.classList.add('hidden');

  toolbox.classList.remove('hidden');
  textareaOpener.classList.remove('hidden');
  sortBySwitcher.classList.remove('hidden');

  headerBoard.classList.remove('entering');
  headerBoard.textContent = '';

  setHashtagSearch();
}

const updateHeaderBoard = () => {
  let info = extractTextInfo(textarea.value);
  headerBoard.innerHTML = `${info.wordCount} words<span class="inlineblock">${info.charCount} chars</span>`;

  if (!headerBoard.classList.contains('entering')) {
    headerBoard.classList.add('entering');
  }

  toolbox.classList.add('hidden');
}

const updateSearchResult = (e) => {

  let term = e.target.value.trim().toLowerCase();
  let hits = filterTextItems(term);

  // change styles on search
  if (term) {
    headerBoard.textContent = hits === 0 ? 'No Results' : `${hits} of ${stack.length}`;

    searchCancelButton.classList.remove('hidden');
    footer.classList.add('hidden');
    toolbox.classList.add('hidden');
  } else {
    headerBoard.textContent = '';

    searchCancelButton.classList.add('hidden');
    footer.classList.remove('hidden');
    toolbox.classList.remove('hidden');

    dropdownList.classList.add('hidden');
  }

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
    .filter(textItem => !textItem.classList.contains('date'))
    .filter(textItem => !textItem.classList.contains('filtered'))
    .forEach(textItem => {
      let contentDIV = textItem.firstElementChild;

      // add highlight when searching
      if (term.length >= 1) {
        contentDIV.innerHTML = contentDIV.textContent.replace(termRegex, "<span class='highlighted'>$1</span>$2");
      }

      // check if the urls are made up of ascii
      if (contentDIV.textContent.match(/(https?:\/\/[\x01-\x7E]+)/g)) {
        contentDIV.innerHTML = contentDIV.textContent.replace(/(https?:\/\/[\x01-\x7E]+)/g, "<a class='emphasized' href='$1' target='_blank'>$1</a>");
      }
    });
  return hits;
};

const setHashtagSearch = () => {
  // remove hashtag from dropwdown
  while (dropdownList.firstChild) {
    dropdownList.removeChild(dropdownList.firstChild);
  }

  for (let i = 0; i < tagStack.length; i++) {
    if (tagStack[i] !== '') {
      let li = document.createElement('li');
      li.textContent = tagStack[i];

      li.addEventListener('mouseover', (e) => {
        // work as hover
        let liSelected = dropdownList.querySelector('.selected');
        if (liSelected !== null) {
          liSelected.classList.remove('selected');
        }
        e.target.classList.add('selected');
      });
      li.addEventListener('click', (e) => {
        searchBox.value = '#' + e.target.textContent;
        searchBox.dispatchEvent(new Event('input'));

        dropdownList.classList.add('hidden');
      });

      dropdownList.appendChild(li);
    }
  }
}

const handleDownload = () => {
  let content = '';

  for (let i = 0; i < stack.length; i++) {
    content += `${stack[i].content}\n`;
    if (stack[i].footnote.pageTitle !== '') {
      content += stack[i].footnote.pageTitle + '\n';
    }
    if (stack[i].footnote.url !== '') {
      content += stack[i].footnote.url + "\n\n";
    }
  }

  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);

  window.URL = window.URL || window.webkitURL;

  var blob = new Blob([bom, content], {
    type: 'data:text/plain'
  });

  const url = window.URL.createObjectURL(blob);

  chrome.downloads.download({
    url: url,
    filename: 'test.txt', // Optional
    saveAs: true
  });
}

// save text and hashtags in the textarea when closing
const saveAddItemForm = () => {
  background.chrome.storage.local.set({
    textarea: textHolder,
    tags: tagsHolder
  });
}

const clearAllItems = () => {
  // clear storage
  stackStorage.reset();

  // remove DOMs
  while (stackDOM.firstChild) {
    stackDOM.removeChild(stackDOM.firstChild);
  }
  removeHashtags();

  textarea.value = '';
  searchBox.value = '';

  // reset holder variables
  stack = [];
  dateStack = [];
  tagStack = ['note', 'clip', 'bookmark'];
  textHolder = '';
  tagsHolder = [];
}

const removeHashtags = () => {
  let removedTags = [];
  while (tagarea.lastChild && tagarea.children.length > 1) {
    removedTags.push(tagarea.lastChild.innerText);
    tagarea.removeChild(tagarea.lastChild);
  }

  return removedTags;
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

  let lastTextItem = stackDOM.lastElementChild;

  // consider text item without url as a note
  if (url) {
    lastTextItem.classList.add('clip');
    lastTextItem.querySelector('.footnote').innerHTML = `<span class="tag hidden">#clip</span><a href="${url}" target="_blank">${pageTitle}</a>`;
  } else {
    if (hashtag.indexOf('bookmark') !== -1) {
      lastTextItem.classList.add('bookmark');
      lastTextItem.querySelector('.footnote').innerHTML = `<span class="tag">#bookmark</span>`;
    } else {
      lastTextItem.classList.add('note');
      lastTextItem.querySelector('.footnote').innerHTML = `<span class="tag">#note</span>`;
    }
  }

  enableURLInText(lastTextItem);

  appendHashTags(hashtag);

  insertDateDIV();

  /* inner functions */
  function enableURLInText(dom) {
    let contentDIV = dom.firstElementChild;
    contentDIV.innerHTML = contentDIV.textContent.replace(/(https?:\/\/[\x01-\x7E]+)/g, "<a href='$1' target='_blank'>$1</a>");
  }

  function appendHashTags() {
    if (typeof hashtag !== 'undefined') {
      hashtag.forEach(item => {
        if (item !== 'note' && item !== 'clip' && item !== 'bookmark') {
          let tagItem = document.createElement('span');
          tagItem.className = 'tag';
          tagItem.textContent = '#' + item;
          lastTextItem.querySelector('.footnote').appendChild(tagItem);
          // tag stack
          let index = tagStack.indexOf(item);
          if (index === -1) {
            tagStack.push(item);
          }
        }
      })
    }
  }

  function insertDateDIV() {
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

const addNewHashtag = (tagName) => {
  let tag = document.createElement('span');

  tag.classList.add('hashtag');
  tag.textContent = tagName.slice(1);
  tag.addEventListener('click', (e) => {
    e.target.parentElement.removeChild(e.target);
    let index = tagsHolder.indexOf(tagName);
    tagsHolder.splice(index, 1);
  });
  tagarea.appendChild(tag);
  tagsHolder.push(tagName);
}


const initializeEventListeners = () => {
  /* window */
  window.onscroll = switchStickyVisibility;

  window.onunload = saveAddItemForm; // fired when popup.html closing

  /* search  */
  searchBox.addEventListener('input', updateSearchResult);

  searchBox.addEventListener('keyup', (e) => {
    let selected = dropdownList.querySelector('.selected');

    if (e.keyCode === 13) {
      if (selected) {
        searchBox.value = '#' + selected.textContent;
        selected.classList.remove('selected');
        searchBox.dispatchEvent(new Event('input'));
      }
      dropdownList.classList.add('hidden');
    } else if (e.keyCode === 38) {
      if (!dropdownList.classList.contains('hidden')) {
        if (selected) {
          if (selected.previousSibling) {
            selected.classList.remove('selected');
            selected.previousSibling.classList.add('selected');
          } else {
            dropdownList.classList.add('hidden');
          }
        }
      }
    } else if (e.keyCode === 40) {
      if (dropdownList.classList.contains('hidden')) {
        dropdownList.classList.remove('hidden');
      } else {
        if (selected) {
          if (selected.nextSibling) {
            selected.classList.remove('selected');
            selected.nextSibling.classList.add('selected');
          }
        } else {
          dropdownList.firstElementChild.classList.add('selected');
        }
      }
    }
  })

  searchBox.addEventListener('focus', closeAddTextItemForm);

  searchCancelButton.addEventListener('click', () => {
    fireSearchWithQuery('');
    searchBox.focus();
  })

  /* toolbox */
  topOpener.addEventListener('click', () => {
    textareaOpener.dispatchEvent(new Event('click'));
  });

  viewSwitcher.addEventListener('click', switchViewStyles);

  fileExporter.addEventListener('click', handleDownload);

  /* add-sort container */
  textareaOpener.addEventListener('mouseover', switchTextareaOpenerIcons);

  textareaOpener.addEventListener('mouseout', switchTextareaOpenerIcons);

  textareaOpener.addEventListener('click', openAddTextItemForm);

  sortBySwitcher.addEventListener('click', switchSortOrder);

  /* textarea */
  textarea.addEventListener('focus', () => {
    // add search query of hashtag 
    if (searchBox.value !== '') {
      removeHashtags();
      addNewHashtag(searchBox.value);
    }

    fitDOMHeightToContent(textarea);
    updateHeaderBoard();
  })

  textarea.addEventListener('input', (e) => {
    if (timer) {
      clearTimeout(timer)
    }

    let errClass = tagarea.querySelector('.error');

    if (errClass) {
      errClass.parentElement.removeChild(errClass);
    }

    let hashtags = e.target.value.match(/(^|\s)((#|＃)[^\s]+)(\s$|\n)/);

    if (hashtags) {
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
          addNewHashtag(hashtags[2])
        }
      }
    }

    textHolder = e.target.value.trim();

    fitDOMHeightToContent(textarea);
    updateHeaderBoard();
  })

  textarea.addEventListener('keyup', (e) => {
    if (e.keyCode === 13 && e.ctrlKey) {
      let errClass = tagarea.querySelector('.error');

      if (errClass === null) {
        let text = textarea.value.trim();
        if (text === '' || text === '\n') {
          textarea.value = '';
          return false;
        }

        let footnote = {
          pageTitle: '',
          url: '',
          hashtag: removeHashtags()
        };

        addTextItemToStack(text, footnote);
        renderTextItem(text, footnote);

        displayItemAddedMessage();

        // clear form and holders
        textarea.value = '';
        textHolder = '';
        tagsHolder = [];

        return false;
      }
    }

    /* inner functions */
    function displayItemAddedMessage() {
      headerBoard.classList.remove('entering');
      headerBoard.textContent = "Item Added!";
      timer = setTimeout(() => {
        headerBoard.textContent = '';
        toolbox.classList.remove('hidden');
      }, 700);
    }
  });

  /* checkboxes for text stack */
  stackDOM.addEventListener('mouseover', closeAddTextItemForm)

  stackDOM.addEventListener('click', e => {
    // tag filter
    if (e.target.classList.contains('tag')) {
      fireSearchWithQuery(e.target.innerHTML);
    } else if (e.target.classList.contains('checkbox')) {
      removeTextItem(e);
    }

    /* inner functions */
    function removeTextItem(e) {
      let parent = e.target.parentElement;

      // apply visual effects and display Message
      e.target.style = 'color: white !important;';
      parent.style.color = 'black !important'
      parent.style.opacity = '0.5';
      parent.style.textDecoration = 'line-through';
      toolbox.classList.add('hidden');
      headerBoard.textContent = "Item Removed!";

      // remove
      setTimeout(() => {
        let lists = Array.from(stackDOM.querySelectorAll('.stackwrapper'));
        let index = lists.indexOf(e.target.parentElement);

        // remove textitem from stack
        stack.splice(index, 1);
        stackStorage.set(JSON.stringify(stack));

        parent.remove();
        headerBoard.textContent = '';
        toolbox.classList.remove('hidden');
      }, 450);
    }
  });

  /* clear stack button */
  clearStackButton.addEventListener('click', () => {
    clearStackWindow.classList.remove('hidden');
  });

  /* modal window */
  overlay.addEventListener('click', () => {
    clearStackWindow.classList.add('hidden');
  });

  confirmButton.addEventListener('click', () => {
    clearAllItems();
    clearStackWindow.classList.add('hidden');
  })

  cancelButton.addEventListener('click', () => {
    clearStackWindow.classList.add('hidden');
  })

  /* inner functions */
  function fireSearchWithQuery(query) {
    searchBox.value = query;
    searchBox.dispatchEvent(new Event('input'));
  };
}

const restoreTextArea = () => {
  chrome.storage.local.get(['textarea', 'tags'], res => {
    textarea.textContent = res.textarea;
    textHolder = res.textarea;
    if (typeof res.tags !== 'undefined') {
      res.tags.forEach(tag => {
        addNewHashtag(tag);
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

  setHashtagSearch();

  // attach bubbleDOM
  document.addEventListener('mouseup', bubble_lib.renderBubble);

  // setTimeout(() => {
  //   let wrapperItems = document.querySelectorAll('.stackwrapper');

  //   for (let i = 0; i < wrapperItems.length; i++) {
  //     let wrapper = wrapperItems[i];
  //     let oldHTML = wrapper.innerHTML;
  //     wrapper.addEventListener('blur', fireChange);
  //     wrapper.addEventListener('keyup', fireChange);
  //     wrapper.addEventListener('paste', fireChange);
  //     wrapper.addEventListener('copy', fireChange);
  //     wrapper.addEventListener('cut', fireChange);
  //     wrapper.addEventListener('mouseup', fireChange);

  //     function fireChange() {
  //       let newHTML = wrapper.innerHTML;
  //       if (oldHTML !== newHTML) {
  //         wrapper.dispatchEvent(new Event('change'));
  //         oldHTML = newHTML;
  //       }
  //     }

  //   }

  // }, 300)



});