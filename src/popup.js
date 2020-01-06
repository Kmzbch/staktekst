import './popup.css';
import * as bubble_lib from './bubble_lib.js';
import {
  escapeRegExp,
  extractTextInfo,
  containsJapanese,
  formatDate,
  fitHeightToContent,
  uuidv4,
  stackStorage,
  enableURLEmbededInText as enableLinkEmbededInText
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
const topboard = document.querySelector('.header-board');

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
const cancelButton = document.querySelector('.cancel');
const sizeChanger = document.querySelector('.size-changer');

// holder variables
let stack = [];
let tagStack = ['note', 'clip', 'bookmark'];
let dateStack = [];

let draftTextHolder = ''; // to save draft text when unloading
let draftHashtagsHolder = [];

let scrollYHolder = 0;

let timer = null;
let background = chrome.extension.getBackgroundPage();

let minHeightOfTextarea = 200;

/* switches */
const switchTextareaSize = () => {
  let sizeChangerIcon = document.querySelector('.size-changer').firstChild;
  if (sizeChangerIcon.textContent === 'expand_more') {
    minHeightOfTextarea = 200;
    textarea.style.height = minHeightOfTextarea + 'px';
    // textarea.style.minHeight = minHeightOfTextarea + 'px';
    sizeChangerIcon.textContent = 'expand_less';
  } else if (sizeChangerIcon.textContent === 'expand_less') {
    minHeightOfTextarea = 25;
    textarea.style.height = minHeightOfTextarea + 'px';
    // textarea.style.minHeight = minHeightOfTextarea + 'px';
    sizeChangerIcon.textContent = 'expand_more';
  }
}

sizeChanger.addEventListener('click', switchTextareaSize);

const switchToolboxVisibility = (forseVisible = false) => {
  if (forseVisible) {
    topboard.textContent = '';
    toolbox.classList.remove('hidden');
  } else {
    toolbox.classList.add('hidden');
  }
}

const switchViewStyles = (forceDefault = false) => {
  let defaultview = document.querySelector('#style_default');
  let listview = document.querySelector('#style_listview');

  let switchingToListView = defaultview.disabled || !forceDefault;

  if (switchingToListView) {
    switchSortOrder(false);
    defaultview.disabled = false;
    listview.disabled = true;
    viewSwitcher.textContent = 'reorder';
  } else {
    switchSortOrder(true);
    defaultview.disabled = true;
    listview.disabled = false;
    viewSwitcher.textContent = 'format_list_bulleted';
  }
}

const switchSortOrder = (forceByNew = false) => {
  let sortingByNew = !sortBySwitcher.innerHTML.includes('New') || !forceByNew;

  if (sortingByNew) {
    sortBySwitcher.innerHTML = 'New <i class="material-icons">arrow_upward</i>';
    stackDOM.style.flexDirection = 'column-reverse';
  } else {
    sortBySwitcher.innerHTML = 'Old <i class="material-icons">arrow_downward</i>';
    stackDOM.style.flexDirection = 'column';
  }
}

const openAddTextItemForm = () => {
  switchToolboxVisibility(false);

  textareaOpener.classList.add('hidden');
  sortBySwitcher.classList.add('hidden');

  textarea.classList.remove('hidden');
  tagarea.classList.remove('hidden');

  textarea.focus();
}

const closeAddTextItemForm = () => {
  textarea.classList.add('hidden');
  tagarea.classList.add('hidden');

  textareaOpener.classList.remove('hidden');
  sortBySwitcher.classList.remove('hidden');

  switchToolboxVisibility(true);
}

const updateTextInfoOnTopboard = (text) => {
  switchToolboxVisibility(false);

  let info = extractTextInfo(text);

  topboard.innerHTML = `${info.wordCount} words<span class="inlineblock">${info.charCount} chars</span>`;

  if (!topboard.classList.contains('entering')) {
    topboard.classList.add('entering');
  }
}

const updateSearchResult = () => {

  let term = searchBox.value.trim().toLowerCase();
  // let hits = filterTextItems(term);
  // filterDropdownListItems();


  let hits;
  if (term.split(' ').length > 1) {
    let tagQuery = term.split(' ')[0]
    let query = term.split(' ')[1];
    hits = filterTextItems(query);
    filterDropdownListItems(tagQuery);
  } else {
    hits = filterTextItems(term);
    filterDropdownListItems(term);
  }

  // change styles on search
  if (term) {
    switchToolboxVisibility(false);

    topboard.textContent = hits === 0 ? 'No Results' : `${hits} of ${stack.length}`;
    searchCancelButton.classList.remove('hidden');
    footer.classList.add('hidden');

  } else {
    switchToolboxVisibility(true);

    searchCancelButton.classList.add('hidden');
    footer.classList.remove('hidden');

    hideDropdownList();
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
      // textItem.firstChild.innerHTML = textItem.firstChild.innerText;
      textItem.firstChild.innerHTML = textItem.firstChild.innerHTML;

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
      } else {
        contentDIV.innerHTML = contentDIV.textContent;
      }

      // check if the urls are made up of ascii
      if (contentDIV.textContent.match(/(https?:\/\/[\x01-\x7E]+)/g)) {
        contentDIV.innerHTML = enableLinkEmbededInText(contentDIV.textContent);
      }

    });
  return hits;
};

const filterDropdownListItems = (tag) => {
  // let tagName = searchBox.value.trim().toLowerCase();
  // tagName = tagName.slice(1);
  let tagName = tag.trim().toLowerCase();
  tagName = tagName.slice(1);


  let termRegex;
  let hits = 0;

  // Search in Japanese/English
  if (containsJapanese(tagName)) {
    termRegex = new RegExp(`^(${escapeRegExp(tagName)})(.*?)`, 'i');
  } else {
    termRegex = new RegExp(`^(${escapeRegExp(tagName)})(.*?)`, 'i');
  }

  Array.from(dropdownList.children)
    .map(tagItem => {
      if (tagItem.textContent.match(termRegex)) {
        tagItem.classList.remove('filtered');
      } else {
        tagItem.classList.add('filtered');
      }
      return tagItem;
    })
}


const setDropdownListItems = () => {
  // remove hashtag from dropwdown
  while (dropdownList.firstChild) {
    dropdownList.removeChild(dropdownList.firstChild);
  }

  tagStack = tagStack.slice(0, 3).concat(tagStack.slice(3).sort());

  tagStack.forEach(tag => {
    if (tag !== '') {
      // append li
      let li = document.createElement('li');
      li.textContent = tag;
      dropdownList.appendChild(li);

      // attach events
      li.addEventListener('mouseover', (e) => {
        // work as hover
        let liSelected = dropdownList.querySelector('.selected');
        if (liSelected) {
          liSelected.classList.remove('selected');
        }
        e.target.classList.add('selected');
      });

      li.addEventListener('click', (e) => {
        fireSearchWithQuery('#' + e.target.textContent);
        hideDropdownList();
      });
    }
  })
}

const exportTextItems = () => {
  let content = '';

  // get text items to export
  let textitemIDs = Array.from(stackDOM.children)
    .filter(textItem => !textItem.classList.contains('date'))
    .filter(textItem => !textItem.classList.contains('filtered'))
    .map(textItem => {
      return textItem.querySelector('input').value;
    });

  let filteredItems = stack.filter(item => textitemIDs.includes(item.id));

  // concatenate contents
  Array.from(filteredItems)
    .forEach(item => {
      content += `${item.content}\n`;
      if (typeof item.footnote.pageTitle !== 'undefined') {
        content += item.footnote.pageTitle + '\n';
      }
      if (typeof item.footnote.url !== 'undefined') {
        content += item.footnote.url + "\n";
      }
      content += '\n';
    })

  // create url to download
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);

  let blob = new Blob([bom, content], {
    type: 'data:text/plain'
  });

  window.URL = window.URL || window.webkitURL;

  const url = window.URL.createObjectURL(blob);

  // download
  chrome.downloads.download({
    url: url,
    filename: formatDate() + '.txt',
    saveAs: true
  });
}

const clearAllItems = () => {
  // clear storage
  stackStorage.reset();

  // remove DOMs
  while (stackDOM.firstChild) {
    stackDOM.removeChild(stackDOM.firstChild);
  }

  // remove hashtags
  while (tagarea.lastChild && tagarea.children.length > 1) {
    tagarea.removeChild(tagarea.lastChild);
  }

  textarea.value = '';
  searchBox.value = '';

  // reset holder variables
  stack = [];
  dateStack = [];
  tagStack = ['note', 'clip', 'bookmark'];
  draftTextHolder = '';
  draftHashtagsHolder = [];
}

const updateTextItem = (id, html) => {
  let index = stack.findIndex(item => item.id === id);
  stack[index].content = html;
  stackStorage.set(JSON.stringify(stack));
};

const addTextItemToStack = (id, type, content, footnote = {}, date = formatDate()) => {
  stack.push({
    id: id,
    type: type,
    content: content,
    date: date,
    footnote: {
      tags: footnote.tags
    },
  });
  stackStorage.set(JSON.stringify(stack));
};
const selectOnDropdownList = (e) => {
  let selected = dropdownList.querySelector('.selected');
  let unfiltered = Array.from(dropdownList.children).filter(tagItem => !tagItem.classList.contains('filtered'));
  let index = unfiltered.findIndex(item => item === selected);

  if (e.keyCode === 13) {
    // Enter
    if (selected) {
      selected.classList.remove('selected');
      fireSearchWithQuery('#' + selected.textContent);
    }
    hideDropdownList()
  } else if (e.keyCode === 38) {
    // Up
    if (!dropdownList.classList.contains('hidden')) {
      if (selected) {
        if (index - 1 >= 0) {
          selected.classList.remove('selected');
          unfiltered[index - 1].classList.add('selected');
        } else {
          hideDropdownList()
        }
      }
    }
  } else if (e.keyCode === 40) {
    // Down
    if (dropdownList.classList.contains('hidden')) {
      showDropdownList()
    } else {
      if (selected) {
        if (unfiltered.length > index + 1) {
          selected.classList.remove('selected');
          unfiltered[index + 1].classList.add('selected');
        }
      } else {
        unfiltered[0].classList.add('selected');
      }
    }
  }
}

const submitForm = (e) => {
  if (e.keyCode === 13 && e.ctrlKey) {
    // Ctrl + Enter
    let errClass = tagarea.querySelector('.error');

    if (errClass === null) {
      let content = textarea.value.trim();
      if (content === '' || content === '\n') {
        textarea.value = '';
        return false;
      }

      // 
      let addingTags = [];
      for (let i = 1; i < tagarea.children.length; i++) {
        if (!tagarea.children[i].classList.contains('size-changer')) {
          addingTags.push(tagarea.children[i].innerText);

        }
      }

      let id = uuidv4();
      let type = 'note';
      let footnote = {
        tags: addingTags
      };
      let date = formatDate();

      addTextItemToStack(id, type, content, footnote, date);
      renderTextItem(id, type, content, footnote, date);

      // display system message
      displayMessageOnTopboard('Item Added!');

      timer = setTimeout(() => {
        updateTextInfoOnTopboard(textarea.value);
      }, 700);

      // clear form and holders
      textarea.value = '';
      draftTextHolder = '';
      draftHashtagsHolder = [];

      return false;
    }
  }
};


/* search */
function fireSearchWithQuery(query) {
  searchBox.value = query;
  searchBox.dispatchEvent(new Event('input'));
};

function showDropdownList() {
  setDropdownListItems();
  // filterDropdownListItems();
  filterDropdownListItems(searchBox.value);
  dropdownList.classList.remove('hidden');
  dropdownList.focus();
}

function hideDropdownList() {
  dropdownList.classList.add('hidden');
}

function cancelSearch() {
  fireSearchWithQuery('');
  searchBox.focus();
}

/* clear stack window modal*/
function showClearStackWindow() {
  clearStackWindow.classList.remove('hidden');
}

function hideClearStackWindow() {
  clearStackWindow.classList.add('hidden');
}

function updateInputForm(e) {
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
        addHashtagToDraft(hashtags[2].slice(1))
      }
    }
  }

  draftTextHolder = e.target.value.trim();

  fitHeightToContent(textarea, minHeightOfTextarea);
  updateTextInfoOnTopboard(textarea.value);
}

function displayMessageOnTopboard(message) {
  if (topboard.classList.contains('entering')) {
    topboard.classList.remove('entering');
  }

  topboard.textContent = message;
  switchToolboxVisibility(false);
}

function removeTextItem(textitemDOM) {
  // apply visual effects and display Message
  textitemDOM.classList.add('removed')

  displayMessageOnTopboard("Item Removed!");

  setTimeout(() => {
    // remove the item
    let id = textitemDOM.querySelector('input').value;
    stack = stack.filter(item => item.id !== id);

    stackStorage.set(JSON.stringify(stack));

    // remove DOM
    textitemDOM.remove();

    switchToolboxVisibility(true);
  }, 450);
}

function attachContentEditableEvents(wrapper) {
  // create and insert
  let editIcon = document.createElement('i');
  editIcon.classList.add('material-icons');
  editIcon.classList.add('edit');
  editIcon.innerText = 'edit';
  wrapper.insertBefore(editIcon, wrapper.querySelector('i'));

  let contentDIV = wrapper.querySelector('.content');

  // add click event
  editIcon.addEventListener('click', function enableEditing() {
    setTimeout(() => {
      contentDIV.contentEditable = true;
      editIcon.classList.add('hidden');
      contentDIV.focus();
    }, 100);
  })

  // add to content DIV
  contentDIV.addEventListener('focus', (e) => {

    wrapper.classList.add('editing');

    // move caret to the text tail
    let selection = window.getSelection();
    let range = document.createRange();

    const p = e.target.lastChild;

    range.setStart(e.target.lastChild, e.target.lastChild.textContent.length);
    range.setEnd(e.target.lastChild, e.target.lastChild.textContent.length);

    selection.removeAllRanges();
    selection.addRange(range);
  })

  contentDIV.addEventListener('blur', (e) => {
    contentDIV.contentEditable = false;
    contentDIV.innerHTML = contentDIV.innerHTML.replace(/<br>$/, '');

    wrapper.classList.remove('editing');
    editIcon.classList.remove('hidden');
  });

  // add to wrapper
  wrapper.addEventListener('dblclick', (e) => {
    if (wrapper.classList.contains('note')) {
      if (!e.target.classList.contains('content')) {
        setTimeout(bubble_lib.hideBubble, 30);
        setTimeout(() => {
          contentDIV.contentEditable = true;
          editIcon.classList.add('hidden');
          contentDIV.focus();
        }, 100)
      }
    }
  });

  let oldHTML = wrapper.innerHTML;

  // detect changes on content editable
  wrapper.addEventListener('blur', fireChange);
  wrapper.addEventListener('keyup', fireChange);
  wrapper.addEventListener('paste', fireChange);
  wrapper.addEventListener('copy', fireChange);
  wrapper.addEventListener('cut', fireChange);
  wrapper.addEventListener('mouseup', fireChange);
  wrapper.addEventListener('change', (e) => {
    let id = e.target.querySelector('input').value;
    let newHTML = contentDIV.innerHTML.replace(/<br>$/, '');
    updateTextInfoOnTopboard(contentDIV.textContent);
    updateTextItem(id, newHTML);
  })

  function fireChange(e) {
    let newHTML = wrapper.innerHTML;
    if (oldHTML !== newHTML) {
      wrapper.dispatchEvent(new Event('change'));
      oldHTML = newHTML;
    }
  }
}

const renderTextItem = (id, type, content, footnote, date = formatDate()) => {
  let stackWrapper = document.createElement('div');
  stackWrapper.className = 'stackwrapper';
  stackWrapper.classList.add(type);
  // stackWrapper.innerHTML = `<div class='content'>${content}</div><i class="material-icons checkbox">check</i><input type="hidden" value="${id}"><div class="spacer"></div><div class="footnote"></div>`;
  stackWrapper.innerHTML = `<div class='content'>${content}</div><i class="material-icons checkbox">check</i><input type="hidden" value="${id}"><input type='hidden' value="${date}"><div class="spacer"></div><div class="footnote"></div>`;

  stackDOM.appendChild(stackWrapper);

  // enable URL link
  let contentDIV = stackWrapper.firstElementChild;
  contentDIV.innerHTML = enableLinkEmbededInText(contentDIV.textContent);

  if (type === 'clip') {
    stackWrapper.querySelector('.footnote').innerHTML = `<span class="tag hidden">#clip</span><a href="${footnote.pageURL}" target="_blank">${footnote.pageTitle}</a>`;
  } else {
    stackWrapper.querySelector('.footnote').innerHTML = `<span class="tag">#${type}</span>`;
    if (type === 'note') {
      attachContentEditableEvents(stackWrapper);
    }
  }

  // add hashtags
  if (typeof footnote.tags !== 'undefined') {
    footnote.tags.forEach(item => {
      if (!['note', 'clip', 'bookmark'].includes(item)) {
        let tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = '#' + item;
        stackWrapper.querySelector('.footnote').appendChild(tag);
        if (!tagStack.includes(item)) {
          tagStack.push(item);
        }
      }
    })
  }
}

const insertDateSeparator = () => {

  Array.from(stackDOM.children).forEach(wrapper => {
    let dateSeparator = document.createElement('div');
    dateSeparator.className = 'date';

    let date = wrapper.querySelectorAll('input')[1].value;

    if (dateStack.length === 0) {
      // dateSeparator.innerHTML = `<a id='${date}' href='#'>${date}</a>`;
      dateSeparator.innerHTML = date;

      stackDOM.insertBefore(dateSeparator, wrapper);
      dateStack.push(date);
    } else {
      if (dateStack[dateStack.length - 1] !== date) {
        dateSeparator.innerHTML = date;
        stackDOM.insertBefore(dateSeparator, wrapper);
        dateStack.push(date);
      }
    }
  })


  // insert current time
  let now = new Date();
  let hours = ('0' + now.getHours()).slice(-2);
  let minutes = ('0' + now.getMinutes()).slice(-2);

  let currentTime = hours + ':' + minutes;
  let todaySeparator = document.createElement('div');
  todaySeparator.className = 'date';
  todaySeparator.classList.add('current');
  //  todaySeparator.textContent = currentTime + ' ' + formatDate();
  todaySeparator.textContent = formatDate() + ' ' + currentTime;

  stackDOM.append(todaySeparator);

}


const renderStack = () => {
  stackStorage.get(raw => {
    if (typeof raw === 'undefined') {
      stackStorage.reset();
    } else {
      stack = JSON.parse(raw);
      stack.forEach(res => {
        let type = res.hasOwnProperty('type') ? res.type : 'note';
        renderTextItem(res.id, type, res.content, res.footnote, res.date);
      });
      insertDateSeparator();

    }
  });
};

const addHashtagToDraft = (tagName) => {
  // create tag
  let hashtag = document.createElement('span');
  hashtag.classList.add('hashtag');
  hashtag.textContent = tagName;
  tagarea.appendChild(hashtag);

  // attach remove event
  hashtag.addEventListener('click', function removeHashTag(e) {
    e.target.parentElement.removeChild(e.target);
    // to be removed from storage
    let index = draftHashtagsHolder.indexOf(tagName);
    draftHashtagsHolder.splice(index, 1);
  });

  // save draft hashtags
  draftHashtagsHolder.push(tagName);
}

const restorDraftForm = () => {
  chrome.storage.local.get(['textarea', 'tags'], result => {
    // restore textarea
    draftTextHolder = result.textarea;
    textarea.textContent = result.textarea;
    // restore tagarea
    if (typeof result.tags !== 'undefined') {
      result.tags.forEach(tag => {
        addHashtagToDraft(tag);
      })
    }
  })
}

const restoreScrollY = () => {
  let now = new Date().getTime();

  chrome.storage.local.get(['scrollY', 'timeClosedLastTime'], result => {
    if (typeof result.timeClosedLastTime !== 'undefined') {
      let last = result.timeClosedLastTime;

      let diff = (now - last);

      if (diff < 30000) {
        // restore scrollY
        if (typeof result.scrollY !== 'undefined') {
          scrollYHolder = result.scrollY;
          window.scrollTo(0, scrollYHolder);
        }
      }
    }
  })
}

const initializeEventListeners = () => {

  /* window */
  window.onunload = function saveDraftForm() {
    background.chrome.storage.local.set({
      textarea: draftTextHolder,
      tags: draftHashtagsHolder
    });
  };

  window.onscroll = function changeStickyOpacityAutomatically() {
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
    // save scrollY position and the time of scrolling
    scrollYHolder = window.scrollY;
    let now = new this.Date().getTime();

    background.chrome.storage.local.set({
      timeClosedLastTime: new this.Date().getTime(),
      scrollY: scrollYHolder,

    });

  }

  /* dropdown list */
  dropdownList.addEventListener('mouseleave', () => {
    hideDropdownList();
  })
  header.addEventListener('mouseleave', () => {
    hideDropdownList();
  })

  /* search  */
  searchBox.addEventListener('click', () => {
    if (getComputedStyle(dropdownList) !== 'hidden') {
      hideDropdownList();
    }
  })

  searchBox.addEventListener('dblclick', () => {
    fireSearchWithQuery('')
    showDropdownList();
  });
  searchBox.addEventListener('click', showDropdownList);

  searchBox.addEventListener('input', updateSearchResult);

  searchBox.addEventListener('keyup', selectOnDropdownList)

  searchBox.addEventListener('focus', closeAddTextItemForm);

  searchCancelButton.addEventListener('click', cancelSearch)

  /* toolbox */
  topOpener.addEventListener('click', openAddTextItemForm);

  viewSwitcher.addEventListener('click', switchViewStyles);

  fileExporter.addEventListener('click', exportTextItems);

  /* add-sort container */
  textareaOpener.addEventListener('click', openAddTextItemForm);

  sortBySwitcher.addEventListener('click', switchSortOrder);

  /* textarea */
  textarea.addEventListener('focus', (e) => {
    hideDropdownList();
    if (searchBox.value.slice(0, 1) === '#' && !draftHashtagsHolder.includes(searchBox.value.slice(1))) {
      while (tagarea.lastChild && tagarea.children.length > 1) {
        tagarea.removeChild(tagarea.lastChild);
      }
      draftHashtagsHolder.length = [];

      let tag = searchBox.value.slice(1).split(' ')[0]
      addHashtagToDraft(tag);
    }
    fitHeightToContent(e.target, minHeightOfTextarea);
    updateTextInfoOnTopboard(e.target.textContent);
  })

  textarea.addEventListener('blur', () => {
    topboard.classList.remove('entering');
    topboard.textContent = '';
  })

  textarea.addEventListener('keyup', submitForm);

  textarea.addEventListener('input', updateInputForm)

  /* checkboxes for text stack */
  stackDOM.addEventListener('mouseover', closeAddTextItemForm)

  stackDOM.addEventListener('click', e => {
    if (e.target.classList.contains('tag')) {
      // when tag clicked
      fireSearchWithQuery(e.target.innerHTML);
    } else if (e.target.classList.contains('checkbox')) {
      // when checkbox clicked
      e.target.style = 'color: white !important;';
      let textitemDOM = e.target.parentElement;
      removeTextItem(textitemDOM);
    }
  });

  /* clear stack button */
  clearStackButton.addEventListener('click', showClearStackWindow);

  /* clear stack window modal */
  overlay.addEventListener('click', hideClearStackWindow);

  confirmButton.addEventListener('click', () => {
    clearAllItems();
    hideClearStackWindow();
  })

  cancelButton.addEventListener('click', hideClearStackWindow)
}

// initialize
document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  restorDraftForm();
  renderStack();

  restoreScrollY();

  tagStack = tagStack.sort();

  // workaround to avoid view switcher delay
  switchViewStyles();
});