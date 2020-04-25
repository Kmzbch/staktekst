// seachbox
const dropdownList = document.querySelector('#dropdownlist');
const textarea = document.querySelector('.add-textitem');
const tagarea = document.querySelector('.tagarea');
const stackDOM = document.querySelector('#textstack');

// state variables
let stack = [];
let tagStack = ['bookmark', 'clip', 'note'];
let dateStack = [];
let windowState = {
  draftText: '',
  draftHashtags: [],
  searchQuery: '',
  scrollY: 0,
  sortedByNew: true
}

/* switches */

const updateSearchResult = () => {

  let term = $('.searchbox').val().trim().toLowerCase();

  windowState.searchQuery = term;

  let hits;
  if (term.split(' ').length > 1 && term.split(' ')[0].slice(0, 1) === '#') {
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

    $('.header-board').text(hits === 0 ? 'No Results' : `${hits} of ${stack.length}`)
    $('.searchcancel-button').removeClass('hidden');

    $('footer').addClass('hidden');

  } else {
    switchToolboxVisibility(true);

    $('.searchcancel-button').addClass('hidden');
    $('footer').removeClass('hidden');

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
        contentDIV.innerHTML = contentDIV.innerHTML.replace(/<br>/ig, '\n');
        contentDIV.innerHTML = contentDIV.textContent.replace(termRegex, "<span class='highlighted'>$1</span>$2");
        contentDIV.innerHTML = contentDIV.innerHTML.replace(/\n/ig, '<br>');

      } else {
        // contentDIV.innerHTML = contentDIV.textContent;
        termRegex = /<span class="highlighted">(.*?)<\/span>/g
        contentDIV.innerHTML = contentDIV.innerHTML.replace(termRegex, '$1');
      }

      // check if the urls are made up of ascii
      if (contentDIV.textContent.match(/(https?:\/\/[\x01-\x7E]+)/g)) {
        contentDIV.innerHTML = enableURLEmbededInText(contentDIV.textContent);
      }

    });
  return hits;
};

const filterDropdownListItems = (tag) => {
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

  Array.from($('#dropdownlist').children())
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
  $('#dropdownlist').empty();

  tagStack = tagStack.slice(0, 3).concat(tagStack.slice(3).sort());

  // create list from tagStack
  tagStack
    .sort()
    .filter(item => isNaN(Date.parse(item))) // filter duedate tag
    .forEach(tag => {
      if (tag !== '') {
        let li = document.createElement('li');
        li.textContent = tag;

        $('#dropdownlist').append(li);

        // attach events
        li.addEventListener('mouseover', (e) => {
          // work as hover
          let liSelected = $('#dropdownlist').find('.selected');
          if (liSelected) {
            liSelected.removeClass('selected');
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
  $('#textstack').empty();

  // remove hashtags
  while (tagarea.lastChild && tagarea.children.length > 1) {
    tagarea.removeChild(tagarea.lastChild);
  }

  $('.add-textitem').val('');
  $('.searchbox').val('');

  // reset state variables
  stack = [];
  dateStack = [];
  tagStack = ['bookmark', 'clip', 'note'];

  windowState = {
    draftText: '',
    draftHashtags: [],
    searchQuery: '',
    scrollY: 0,
    sortedByNew: true
  }
}

const selectOnDropdownList = (e) => {
  let liSelected = $('#dropdownlist').find('.selected');
  let unfiltered = Array.from($('#dropdownlist').children()).filter(tagItem => !tagItem.hasClass('filtered'));
  let index = unfiltered.findIndex(item => item === liSelected);

  if (e.keyCode === 13) {
    // Enter
    if (liSelected) {
      liSelected.removeClass('selected');
      fireSearchWithQuery('#' + liSelected.text());
    }
    hideDropdownList()
  } else if (e.keyCode === 38) {
    // Up
    if (!$('#dropdownlist').hasClass('hidden')) {
      if (liSelected) {
        if (index - 1 >= 0) {
          // move up
          liSelected.removeClass('selected');
          unfiltered[index - 1].addClass('selected');
        } else {
          // if no item to select at the top
          hideDropdownList()
        }
      }
    }
  } else if (e.keyCode === 40) {
    // Down
    if ($('#dropdownlist').hasClass('hidden')) {
      showDropdownList()
    } else {
      if (liSelected) {
        if (unfiltered.length > index + 1) {
          // move down
          liSelected.classList.remove('selected');
          unfiltered[index + 1].classList.add('selected');
        }
      } else {
        // if no item to select at the bottom
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
      let content = $('.add-textitem').val().trim();
      if (content === '' || content === '\n') {
        $('.add-textitem').val('');
        return false;
      }

      // 
      let addingTags = [];
      for (let i = 1; i < tagarea.children.length; i++) {
        if (!tagarea.children[i].classList.contains('size-changer')) {
          addingTags.push(tagarea.children[i].innerText);
        }
      }

      //
      let id = uuidv4();
      let type = 'note';
      let footnote = {
        tags: addingTags
      };
      let date = formatDate();

      // add item to stack
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

      renderTextItem(id, type, content, footnote, date);

      // display system message
      displayMessageOnTopboard('Item Added!');
      setTimeout(() => {
        updateTextInfoOnTopboard($('.add-textitem').val());
      }, 700);

      // clear form and holders to the initial state
      $('.add-textitem').val('');

      windowState.draftText = '';
      windowState.draftHashtags = [];

      switchTextareaSize(e, true);

      return false;
    }
  }
};


function updateInputForm(e) {
  $('.tagarea').find('.error').remove();

  let hashtags = e.target.value.match(/(^|\s)((#|＃)[^\s]+)(\s$|\n)/);

  if (hashtags) {
    let regex = new RegExp(`(^|\\s)${escapeRegExp(hashtags[2])}(\\s$|\\n)`);

    if ($('.hashtag').length >= 5) {
      $('<span>', {
        addClass: 'error',
        text: 'タグは最大5個まで'
      }).appendTo(tagarea)
    } else {
      e.target.value = e.target.value.replace(regex, '')
      addHashtagToDraft(hashtags[2].slice(1))
    }
  }

  windowState.draftText = e.target.value.trim();

  fitHeightToContent(textarea);
  updateTextInfoOnTopboard($('.add-textitem').val());
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

  wrapper.addEventListener('focusout', (e) => {
    contentDIV.contentEditable = false;
    contentDIV.innerHTML = contentDIV.innerHTML.replace(/<br>$/, '');

    wrapper.classList.remove('editing');
    editIcon.classList.remove('hidden');
  });

  contentDIV.addEventListener('keyup', (e) => {
    fireChange(e);
  });

  // add to wrapper
  wrapper.addEventListener('dblclick', (e) => {
    if (wrapper.classList.contains('note')) {
      if (!e.target.classList.contains('content')) {
        setTimeout(hideBubble, 30);
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

    // update teext item
    let index = stack.findIndex(item => item.id === id);
    stack[index].content = newHTML.replace(/<br>/ig, '\n');
    stackStorage.set(JSON.stringify(stack));
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
  stackWrapper.id = id;
  stackWrapper.classList.add(type);

  stackWrapper.innerHTML = `<div class='content'>${content}</div><i class="material-icons checkbox">check</i><input type="hidden" value="${id}"><input type='hidden' value="${date}"><div class="spacer"></div><div class="footnote"></div>`;


  $('#textstack').append(stackWrapper);

  // enable URL link
  let contentDIV = stackWrapper.firstElementChild;
  contentDIV.innerHTML = enableURLEmbededInText(contentDIV.textContent);

  if (type === 'clip') {
    stackWrapper.querySelector('.footnote').innerHTML = `<span class="tag hidden">#clip</span><a href="${footnote.pageURL}" target="_blank">${footnote.pageTitle}</a>`;
  } else {
    stackWrapper.querySelector('.footnote').innerHTML = `<span class="tag">#${type}</span>`;
    if (type === 'note') {
      attachContentEditableEvents(stackWrapper);
    }
  }
  contentDIV.innerHTML = contentDIV.innerHTML.replace(/\n/gi, '<br>');

  if (typeof footnote.tags !== 'undefined') {
    footnote.tags.forEach(item => {
      if (!['note', 'clip', 'bookmark'].includes(item)) {
        let tag = document.createElement('span');
        tag.className = 'tag';
        if (!isNaN(Date.parse(item))) {
          tag.classList.add('duedate');
          tag.textContent = '~' + item;

          stackWrapper.querySelector('.footnote').appendChild(tag);

          tag.parentNode.insertBefore(tag, tag.parentNode.firstChild);

        } else {
          tag.textContent = '#' + item;
          stackWrapper.querySelector('.footnote').appendChild(tag);
        }
        if (!tagStack.includes(item)) {
          tagStack.push(item);
        }
      }
    })

    if (stackWrapper.querySelector('.footnote').childNodes.length < 5) {
      let divWrap = document.createElement('div');
      divWrap.classList.add('divWrap');
      stackWrapper.querySelector('.footnote').appendChild(divWrap)

      let input = document.createElement('input');
      input.type = 'text';
      input.classList.add('tagadd');
      input.addEventListener('blur', (ev) => {
        // ev.target.remove(ev.target);
      })

      input.addEventListener('keyup', (ev) => {
        ev.preventDefault();
        if (ev.keyCode === 13) {
          if (ev.target.value !== '') {
            let id = stackWrapper.querySelector('input').value;
            // update Tag
            let tagName = ev.target.value;
            let index = stack.findIndex(item => item.id === id);
            stack[index].footnote.tags.push(tagName);
            stackStorage.set(JSON.stringify(stack));

            // 
            let newTag = document.createElement('span');
            newTag.className = 'tag';
            if (!isNaN(Date.parse(ev.target.value))) {
              newTag.classList.add('duedate');
              newTag.textContent = '~' + ev.target.value;
              stackWrapper.querySelector('.footnote').appendChild(newTag);
              newTag.parentNode.insertBefore(newTag, newTag.parentNode.firstChild);
            } else {
              newTag.textContent = '#' + ev.target.value;
              stackWrapper.querySelector('.footnote').insertBefore(newTag, divWrap);
            }
            if (!tagStack.includes(ev.target.value)) {
              tagStack.push(ev.target.value);
            }
            ev.target.value = '';
            if (stackWrapper.querySelector('.footnote').childElementCount >= 6) {
              divWrap.classList.add('hidden');
            }
          }
        }
      })
      // stackWrapper.querySelector('.footnote').appendChild(input);
      divWrap.appendChild(input);
    }
  }
}

/**
 * 
 */
const insertDateSeparator = () => {
  Array.from(stackDOM.children).forEach(wrapper => {
    let dateSeparator = document.createElement('div');
    dateSeparator.className = 'date';

    let date = wrapper.querySelectorAll('input')[1].value;

    if (dateStack.length === 0) {
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
  $('<div>', {
    addClass: 'date current',
    text: formatDate() + ' ' + hours + ':' + minutes
  }).appendTo(stackDOM)
}

const initializeEventListeners = () => {

  /* window events */
  window.onunload = () => {
    // save state in background.js
    chrome.extension.getBackgroundPage().chrome.storage.local.set({
      searchQuery: windowState.searchQuery,
      textarea: windowState.draftText,
      tags: windowState.draftHashtags,
      scrollY: windowState.scrollY,
      timeClosedLastTime: new Date().toJSON(),
      sortedByNew: windowState.sortedByNew
    });
  };

  window.onscroll = () => {
    // show header and footer when scroll to the top/bottom
    if (window.pageYOffset == 0) {
      $('header').css('opacity', 1)
      $('footer').css('opacity', 1)
    } else if (document.body.offsetHeight + window.scrollY >= document.body.scrollHeight) {
      $('header').css('opacity', 1)
      $('footer').css('opacity', 1)
    } else {
      $('header').css('opacity', 0)
      $('footer').css('opacity', 0)
    }
    // save scrollY position
    windowState.scrollY = window.scrollY;
  }

  window.addEventListener('blur', () => {
    chrome.runtime.sendMessage({
      command: 'OVERLAY_OFF'
    },
      null
    );
  })

  /* dropdown list */
  $('#dropdownlist').on('mouseleave', hideDropdownList);

  $('header').on('mouseleave', hideDropdownList);

  /* searchbox  */
  $('.searchbox').on({
    click: hideDropdownList,
    dblclick: showDropdownList,
    focus: closeAddTextItemForm,
    keyup: selectOnDropdownList,
    input: updateSearchResult
  })

  $('.searchcancel-button').click(cancelSearch);

  /* toolbox */
  $('.opener-top').click(openAddTextItemForm);
  $('.fileexport').click(exportTextItems);

  /* add-sort container */
  $('.opener').click(openAddTextItemForm);
  $('.sort-by').click(switchSortOrder);

  /* textarea */
  textarea.addEventListener('focus', (e) => {
    if ($('.searchbox').val().slice(0, 1) === '#'
      && !windowState.draftHashtags.includes($('.searchbox').val().slice(1))) {
      while (tagarea.lastChild && tagarea.children.length > 1) {
        tagarea.removeChild(tagarea.lastChild);
      }
      let tag = $('.searchbox').val().slice(1).split(' ')[0]
      addHashtagToDraft(tag);
    }
    fitHeightToContent(e.target);
    updateTextInfoOnTopboard(e.target.textContent);
  })

  $('.add-textitem').on({
    keyup: submitForm,
    input: updateInputForm,
    blur: () => {
      $('.header-board').removeClass('entering');
      $('.header-board').text('')
    },
  })

  $('.size-changer').click(switchTextareaSize);

  // text stack
  stackDOM.addEventListener('click', (e) => {
    if (e.target.classList.contains('tag')) {
      // when hashtag clicked
      fireSearchWithQuery(e.target.innerHTML);
    } else if (e.target.classList.contains('checkbox')) {
      // when checkbox clicked
      e.target.style = 'color: white !important;';
      let textItem = e.target.parentElement;
      removeTextItem(textItem);
    } else {
      closeAddTextItemForm();
    }
  });

  /* clear stack button */
  $('.clear-button').click(showClearStackWindow);

  /* clear stack window modal */
  $('.overlay').click(hideClearStackWindow);

  // clear stack dialog
  $('.ok').click(() => {
    clearAllItems();
    hideClearStackWindow();
  });

  $('.cancel').click(hideClearStackWindow);

}

/* search */
function fireSearchWithQuery(query) {
  $('.searchbox').val(query);
  $('.searchbox').trigger('input')
};

function showDropdownList() {
  setDropdownListItems();
  filterDropdownListItems($('.searchbox').val());
  $('#dropdownlist').removeClass('hidden');
}

function hideDropdownList() {
  $('#dropdownlist').addClass('hidden');
}

function cancelSearch() {
  fireSearchWithQuery('');
  $('.searchbox').trigger('focus');
}

/* clear stack window modal*/
function showClearStackWindow() {
  $('#clear-window').removeClass('hidden');
}

function hideClearStackWindow() {
  $('#clear-window').addClass('hidden');
}

function displayMessageOnTopboard(message) {
  if ($('.header-board').hasClass('entering')) {
    $('.header-board').removeClass('entering');
  }
  $('.header-board').text(message);

  switchToolboxVisibility(false);
}

const switchSortOrder = (forceByNew = false) => {
  let sortingByNew = !$('.sort-by').html().includes('New') || !forceByNew;
  if (sortingByNew) {
    $('.sort-by').html('New <i class="material-icons">arrow_upward</i>');
    $('#textstack').css('flexDirection', 'column-reverse')
  } else {
    $('.sort-by').html('Old <i class="material-icons">arrow_downward</i>');
    $('#textstack').css('flexDirection', 'column')
  }
  windowState.sortedByNew = sortingByNew;
}

const switchToolboxVisibility = (forseVisible = false) => {
  if (forseVisible) {
    $('.header-board').text('');
    $('#toolbox').removeClass('hidden');
  } else {
    $('#toolbox').addClass('hidden');
  }
}

const openAddTextItemForm = () => {
  switchToolboxVisibility(false);
  // hide
  $('.opener').addClass('hidden');
  $('.sort-by').addClass('hidden');
  // show
  $('.add-textitem').removeClass('hidden');
  $('.tagarea').removeClass('hidden');
  // focus
  $('.add-textitem').trigger('focus');
}

const closeAddTextItemForm = () => {
  switchToolboxVisibility(true);
  // hide
  $('.add-textitem').addClass('hidden');
  $('.tagarea').addClass('hidden');
  // show
  $('.opener').removeClass('hidden');
  $('.sort-by').removeClass('hidden');
  // turn off overlay
  chrome.runtime.sendMessage({
    command: 'OVERLAY_OFF'
  },
    null);
}

const updateTextInfoOnTopboard = (text) => {
  switchToolboxVisibility(false);

  let info = extractTextInfo(text);

  $('.header-board').html(
    `${info.wordCount} words<span class="inlineblock">${info.charCount} chars</span>`
  );

  if (!$('.header-board').hasClass('entering')) {
    $('.header-board').addClass('entering');
  }
}

const addHashtagToDraft = (tagName) => {
  // create tag
  tagarea.append($('<span>', {
    addClass: 'hashtag',
    text: tagName,
    on: {
      // attach remove event
      'click': (e) => {
        $(e.currentTarget).remove();
        let index = windowState.draftHashtags.indexOf(tagName);
        windowState.draftHashtags.splice(index, 1);
      }
    }
  }).get(0))
  // save draft hashtags
  windowState.draftHashtags.push(tagName)
}

/**
 * render textitems on stack
 */
const renderStack = () => {
  // read from storage
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

/**
 * Restore the previous popup window state
 * 
 */
const restorePreviousState = () => {
  chrome.storage.local.get(['searchQuery', 'textarea', 'tags', 'timeClosedLastTime', 'scrollY', 'sortedByNew'],
    state => {
      if (typeof state.timeClosedLastTime !== 'undefined') {
        let timeElapsed = (new Date() - new Date(state.timeClosedLastTime));

        if (timeElapsed < 30000) {
          // restore textarea
          if (typeof state.textarea !== 'undefined') {
            windowState.draftText = state.textarea;
            $('.add-textitem').text(state.textarea);
          }
          // restore tagarea
          if (typeof state.tags !== 'undefined') {
            state.tags.forEach(t => {
              addHashtagToDraft(t);
            })
          }
          // restore scrollY
          if (typeof state.scrollY !== 'undefined') {
            windowState.scrollY = state.scrollY;
            window.scrollTo(0, state.scrollY);
          }
          // restore searchbox
          if (typeof state.searchQuery !== 'undefined') {
            fireSearchWithQuery(state.searchQuery);
            windowState.searchQuery = $('.searchbox').val();
          }
          // restore sort order
          if (typeof state.sortedByNew !== 'undefined') {
            //            fireSearchWithQuery(state.searchQuery);
            switchSortOrder(state.sortedByNew ? false : true)
          }

        }
      }
    })
}

const switchTextareaSize = (e, forceExpandLess = false) => {
  let sizeChangerIcon = $('.size-changer').find('i');

  let config = sizeChangerIcon.text() === 'expand_less' || forceExpandLess ?
    {
      height: '25px',
      minHeight: '25px',
      icon: 'expand_more',
      command: 'OVERLAY_OFF'
    } : {
      height: '300px',
      minHeight: '300px',
      icon: 'expand_less',
      command: 'OVERLAY_ON'
    }

  // change textarea size and icon
  $('.add-textitem').css({
    height: config.height,
    minHeight: config.minHeight
  })
  sizeChangerIcon.text(config.icon);

  // turn on/off overlay of the current tab
  chrome.runtime.sendMessage({
    command: config.command
  },
    null
  );
}


// initialize
document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  renderStack();
  restorePreviousState();
});