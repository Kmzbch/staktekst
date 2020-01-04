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
  enableURLEmbededInText
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
const cancelButton = document.querySelector('.cancel')

// holder variables
let stack = [];
let tagStack = ['note', 'clip', 'bookmark'];
let dateStack = [];

let draftTextHolder = ''; // to save draft text when unloading
let draftHashtagsHolder = [];

let timer = null;
let background = chrome.extension.getBackgroundPage();

/* switches */
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
    defaultview.disabled = false;
    listview.disabled = true;
    viewSwitcher.textContent = 'reorder';
  } else {
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
  let hits = filterTextItems(term);

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

      // console.log(contentDIV.children.length);


      // if (contentDIV.textContent.match(termRegex).length > 0) {
      //   if (term.length >= 1) {
      //     contentDIV.innerHTML = contentDIV.innerHTML.replace(termRegex, "<span class='highlighted'>$1</span>$2");
      //   } else {
      //     contentDIV.innerHTML = contentDIV.textContent;
      //   }
      // } else {
      //   let consumedTerm = '';
      //   let tempTerm = term;
      //   let hit;
      //   let hitRange = [];
      //   let newRegex;
      //   let hitWords;
      //   let replaced = false;
      //   contentDIV.childNodes.forEach(node => {
      //     if (consumedTerm.length === 0) {
      //       newRegex = new RegExp(`^.*(${escapeRegExp(tempTerm)}).*$`, 'ig')
      //       console.log(node);
      //       hitWords = node.innerText.match(newRegex);
      //       if (hitWords.length > 0) {
      //         // totally replace
      //         node.innerText.replace(termRegex, "<span class='highlighted'>$1</span>$2");
      //         termTerm = term;
      //         consumedTerm = '';
      //         replaced = true;
      //       } else {
      //         // match with part of term
      //         newRegex = new RegExp(`^.*(${escapeRegExp(tempTerm)})$`, 'i')
      //       }
      //     } else {
      //       newRegex = new RegExp(`^(${escapeRegExp(tempTerm)}).*$`, 'i')
      //     }
      //     if (!replaced) {
      //       while (tempTerm.length !== 0 && hit === null) {
      //         hit = node.innerText.match(newRegex);
      //         if (hit) {
      //           hitRange.push({
      //             node: node,
      //             from: hit.index,
      //             len: node.innerText.length
      //           })
      //           console.log(hitRange);
      //         }
      //         consumedTerm = tempTerm.slice(x.length - 1) + consumedTerm;
      //         tempTerm = tempTerm.slice(0, x.length - 1);
      //         newRegex = new RegExp(`^.*(${escapeRegExp(tempTerm)})$`, 'i');
      //       }
      //       if (tempTerm.length === 0) {
      //         while (hitRange.length !== 0) {
      //           let x = hitRange.pop()
      //           let part = x.node.innerText.slice(from, len);
      //           let partRegex = new RegExp(`(${escapeRegExp(part)})`, 'i');
      //           x.node.innerText.replace(partRegex, "<span class='highlighted'>$1</span>");
      //         }
      //         // reset
      //         tempTerm = term;
      //         consumedTerm = '';
      //         hit = null;
      //         hitRange = {}
      //       } else {
      //         tempTerm = consumedTerm;
      //         hit = null;
      //       }
      //     } else {
      //       replaced = false;
      //     }
      //   })

      // }

      // // check if the urls are made up of ascii
      // if (contentDIV.textContent.match(/(https?:\/\/[\x01-\x7E]+)/g)) {
      //   contentDIV.innerHTML = contentDIV.textContent.replace(/(https?:\/\/[\x01-\x7E]+)/g, "<a class='emphasized' href='$1' target='_blank'>$1</a>");
      // }
    });
  return hits;
};

const setDropdownListItems = () => {
  // remove hashtag from dropwdown
  while (dropdownList.firstChild) {
    dropdownList.removeChild(dropdownList.firstChild);
  }

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


/* stack operation*/
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
      tagStack = tagStack.sort();

      attachEditIconsEvent();
    }
  });
};

const renderTextItem = (id, type, content, footnote, date = formatDate()) => {
  // const template = `<div class="stackwrapper"><div class='content' contenteditable="true">${content}</div><i class="material-icons checkbox">check</i><input type="hidden" value="${id}"><div class="spacer"></div><div class="footnote"></div></div>`;
  const template = `<div class="stackwrapper"><div class='content'>${content}</div><i class="material-icons checkbox">check</i><input type="hidden" value="${id}"><div class="spacer"></div><div class="footnote"></div></div>`;

  stackDOM.innerHTML += template;

  let lastTextItem = stackDOM.lastElementChild;
  lastTextItem.classList.add(type);

  if (type === 'clip') {
    lastTextItem.querySelector('.footnote').innerHTML = `<span class="tag hidden">#clip</span><a href="${footnote.pageURL}" target="_blank">${footnote.pageTitle}</a>`;
  } else {
    lastTextItem.querySelector('.footnote').innerHTML = `<span class="tag">#${type}</span>`;
    if (type === 'note') {
      let editIcon = document.createElement('i');
      editIcon.classList.add('material-icons');
      editIcon.classList.add('edit');
      editIcon.innerText = 'edit';

      lastTextItem.insertBefore(editIcon, lastTextItem.querySelector('i'));
    }
  }

  let contentDIV = lastTextItem.firstElementChild;
  contentDIV.innerHTML = enableURLEmbededInText(contentDIV.textContent);

  appendHashTags(footnote.tags);

  insertDateDIV();

  function appendHashTags() {
    if (typeof footnote.tags !== 'undefined') {
      footnote.tags.forEach(item => {
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
        if (selected.previousSibling) {
          selected.classList.remove('selected');
          selected.previousSibling.classList.add('selected');
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
        if (selected.nextSibling) {
          selected.classList.remove('selected');
          selected.nextSibling.classList.add('selected');
        }
      } else {
        dropdownList.firstElementChild.classList.add('selected');
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
        addingTags.push(tagarea.children[i].innerText);
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

function attachEditIconsEvent() {
  let editIcons = document.querySelectorAll('.edit');
  for (let i = 0; i < editIcons.length; i++) {
    editIcons[i].addEventListener('click', (event) => {
      let contentDIV = event.target.parentElement.querySelector('.content')
      contentDIV.contentEditable = true;
      editIcons[i].classList.add('hidden');
      contentDIV.focus();

    })
  }
  let wrapperItems = document.querySelectorAll('.stackwrapper');
  for (let i = 0; i < wrapperItems.length; i++) {
    let wrapper = wrapperItems[i];
    let oldHTML = wrapper.innerHTML;
    wrapper.addEventListener('blur', fireChange);
    wrapper.addEventListener('keyup', fireChange);

    wrapper.addEventListener('paste', fireChange);
    wrapper.addEventListener('copy', fireChange);
    wrapper.addEventListener('cut', fireChange);
    wrapper.addEventListener('mouseup', fireChange);

    wrapper.addEventListener('change', (e) => {
      let id = e.target.querySelector('input').value;
      let newHTML = e.target.querySelector('.content').innerHTML.replace(/<br>$/, '');

      updateTextInfoOnTopboard(e.target.querySelector('.content').textContent);

      updateTextItem(id, newHTML);
    })

    wrapper.querySelector('.content').addEventListener('blur', (e) => {

      wrapper.classList.remove('editing');

      let editIcon = e.target.parentElement.querySelector('.edit');
      editIcon.classList.remove('hidden');
      e.target.contentEditable = false;
      e.target.innerHTML = e.target.innerHTML.replace(/<br>$/, '');

    });
    wrapper.addEventListener('dblclick', (e) => {

      if (wrapper.classList.contains('note')) {
        if (!e.target.classList.contains('content')) {
          setTimeout(bubble_lib.hideBubble, 30);
          setTimeout(() => {
            let contentDIV = e.target.querySelector('.content');
            contentDIV.contentEditable = true;
            wrapper.querySelector('i').classList.add('hidden');
            contentDIV.focus();
          }, 100)
        }

      }
    });

    wrapper.querySelector('.content').addEventListener('focus', (e) => {
      updateTextInfoOnTopboard(e.target.textContent);
      wrapper.classList.add('editing');
      var selection = window.getSelection();
      var range = document.createRange();
      const p = e.target.lastChild;
      range.setStart(e.target.lastChild, e.target.lastChild.textContent.length);
      range.setEnd(e.target.lastChild, e.target.lastChild.textContent.length);

      selection.removeAllRanges();
      selection.addRange(range);
    })


    function fireChange(e) {
      let newHTML = wrapper.innerHTML;
      if (oldHTML !== newHTML) {
        wrapper.dispatchEvent(new Event('change'));
        oldHTML = newHTML;
      }
    }
  }

}

/* search */
function fireSearchWithQuery(query) {
  searchBox.value = query;
  searchBox.dispatchEvent(new Event('input'));
};

function showDropdownList() {
  setDropdownListItems();
  dropdownList.classList.remove('hidden');
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


function inputForm(e) {
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
        addNewHashtag(hashtags[2].slice(1))
      }
    }
  }

  draftTextHolder = e.target.value.trim();

  fitHeightToContent(textarea);
  updateTextInfoOnTopboard(textarea.value);
}

const initializeEventListeners = () => {

  /* window */
  window.onunload = function saveDraftForm() {
    // save text and hashtags in the textarea when closing
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
  }

  /* search  */
  searchBox.addEventListener('dblclick', showDropdownList);

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
    fitHeightToContent(e.target);
    updateTextInfoOnTopboard(e.target.textContent);
  })

  textarea.addEventListener('blur', () => {
    topboard.classList.remove('entering');
    topboard.textContent = '';
  })

  textarea.addEventListener('keyup', submitForm);

  textarea.addEventListener('input', inputForm)

  /* checkboxes for text stack */
  stackDOM.addEventListener('mouseover', closeAddTextItemForm)

  stackDOM.addEventListener('click', e => {
    // tag filter
    if (e.target.classList.contains('tag')) {
      fireSearchWithQuery(e.target.innerHTML);
    } else if (e.target.classList.contains('checkbox')) {
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

    textitemDOM.remove();

    switchToolboxVisibility(true);
  }, 450);
}

const addNewHashtag = (tagName) => {
  // create tag
  let hashtag = document.createElement('span');
  hashtag.classList.add('hashtag');
  hashtag.textContent = tagName;
  tagarea.appendChild(hashtag);

  // attach remove event
  hashtag.addEventListener('click', function removeTag(e) {
    e.target.parentElement.removeChild(e.target);
    let index = draftHashtagsHolder.indexOf(tagName);
    draftHashtagsHolder.splice(index, 1);
  });

  // save draft hashtags
  draftHashtagsHolder.push(tagName);
}

const restoreTextArea = () => {
  chrome.storage.local.get(['textarea', 'tags'], result => {
    // restore textarea
    draftTextHolder = result.textarea;
    textarea.textContent = result.textarea;
    // restore tagarea
    if (typeof result.tags !== 'undefined') {
      result.tags.forEach(tag => {
        addNewHashtag(tag);
      })
    }
  })
}

// initialize
document.addEventListener('DOMContentLoaded', () => {
  renderStack();
  restoreTextArea();
  initializeEventListeners();

  // workaround to avoid displaying view switcher delay
  switchViewStyles();
  setDropdownListItems();
});