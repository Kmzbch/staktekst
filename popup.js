// seachbox
const dropdownList = document.querySelector('#dropdownlist');
const textarea = document.querySelector('.add-textitem');
const tagarea = document.querySelector('.tagarea');
const stackDOM = document.querySelector('#textstack');

// holder variables
let stack = [];
let tagStack = ['note', 'clip', 'bookmark'];
let dateStack = [];

let draftTextHolder = ''; // to save draft text when unloading
let draftHashtagsHolder = [];

let searchQueryHolder = '';
let scrollYHolder = 0;

let timer = null;
let background = chrome.extension.getBackgroundPage();

/* switches */
const switchTextareaSize = (e, forceExpandLess = false) => {
  let sizeChangerIcon = document.querySelector('.size-changer').firstChild;

  if (sizeChangerIcon.textContent === 'expand_less' || forceExpandLess) {
    textarea.style.height = 25 + 'px';
    textarea.style.minHeight = 25 + 'px';
    sizeChangerIcon.textContent = 'expand_more';

    //
    chrome.runtime.sendMessage({
      command: 'OVERLAY_OFF'
    },
      null
    );

  } else if (sizeChangerIcon.textContent === 'expand_more') {
    textarea.style.height = 300 + 'px';
    textarea.style.minHeight = 300 + 'px';

    sizeChangerIcon.textContent = 'expand_less';

    //
    chrome.runtime.sendMessage({
      command: 'OVERLAY_ON'
    },
      null
    );
  }
}

const switchToolboxVisibility = (forseVisible = false) => {
  if (forseVisible) {
    $('.header-board').text('');
    $('#toolbox').removeClass('hidden');
  } else {
    $('#toolbox').addClass('hidden');
  }
}


const switchSortOrder = (forceByNew = false) => {
  let sortingByNew = !$('.sort-by').html().includes('New') || !forceByNew;
  if (sortingByNew) {
    $('.sort-by').html('New <i class="material-icons">arrow_upward</i>');
    stackDOM.style.flexDirection = 'column-reverse';
  } else {
    $('.sort-by').html('Old <i class="material-icons">arrow_downward</i>');
    stackDOM.style.flexDirection = 'column';
  }
}

const openAddTextItemForm = () => {
  switchToolboxVisibility(false);

  $('.opener').addClass('hidden');
  $('.sort-by').addClass('hidden');

  textarea.classList.remove('hidden');
  tagarea.classList.remove('hidden');

  textarea.focus();
}

const closeAddTextItemForm = () => {
  chrome.runtime.sendMessage({
    command: 'OVERLAY_OFF'
  },
    null);

  textarea.classList.add('hidden');
  tagarea.classList.add('hidden');

  $('.opener').removeClass('hidden');
  $('.sort-by').removeClass('hidden');

  switchToolboxVisibility(true);
}

const updateTextInfoOnTopboard = (text) => {
  switchToolboxVisibility(false);

  let info = extractTextInfo(text);

  $('.header-board').html(`${info.wordCount} words<span class="inlineblock">${info.charCount} chars</span>`);

  if (!$('.header-board').hasClass('entering')) {
    $('.header-board').addClass('entering');
  }
}

const updateSearchResult = () => {

  let term = $('.searchbox').val().trim().toLowerCase();

  searchQueryHolder = term;

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
  // remove all from dropdown
  while ($('#dropdownlist').first()) {
    $('#dropdownlist').remove($('#dropdownlist').first());
  }

  tagStack = tagStack.slice(0, 3).concat(tagStack.slice(3).sort());

  // create list from tagStack
  tagStack
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

  // remove DOMs
  while (stackDOM.firstChild) {
    stackDOM.removeChild(stackDOM.firstChild);
  }

  // remove hashtags
  while (tagarea.lastChild && tagarea.children.length > 1) {
    tagarea.removeChild(tagarea.lastChild);
  }

  textarea.value = '';
  $('.searchbox').val('');

  // reset holder variables
  stack = [];
  dateStack = [];
  tagStack = ['note', 'clip', 'bookmark'];
  draftTextHolder = '';
  draftHashtagsHolder = [];
}

const updateTextItem = (id, html) => {
  let index = stack.findIndex(item => item.id === id);
  //  stack[index].content = html;

  stack[index].content = html.replace(/<br>/ig, '\n');
  console.log(stack[index].content);
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


      //
      switchTextareaSize(e, true);

      chrome.runtime.sendMessage({
        command: 'OVERLAY_OFF'
      },
        response => {
          console.log(response.message);
        }
      );

      return false;
    }
  }
};

/* search */
function fireSearchWithQuery(query) {
  $('.searchbox').val(query);
  $('.searchbox').trigger('input')
};

function showDropdownList() {
  setDropdownListItems();
  filterDropdownListItems($('.searchbox').val());
  // show
  dropdownList.classList.remove('hidden');
}

function hideDropdownList() {
  dropdownList.classList.add('hidden');
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
      addHashtagToDraft(hashtags[2].slice(1))
    }
  }

  draftTextHolder = e.target.value.trim();

  fitHeightToContent(textarea);
  updateTextInfoOnTopboard(textarea.value);
}

function displayMessageOnTopboard(message) {

  if ($('.header-board').hasClass('entering')) {
    $('.header-board').removeClass('entering');
  }

  $('.header-board').text(message);
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
    // if (e.target.classList.contains('content')) {
    let id = e.target.querySelector('input').value;
    let newHTML = contentDIV.innerHTML.replace(/<br>$/, '');
    updateTextInfoOnTopboard(contentDIV.textContent);
    updateTextItem(id, newHTML);

    // }
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

  stackDOM.appendChild(stackWrapper);

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

const addHashtagToDraft = (tagName) => {
  // create tag
  tagarea.append($('<span>', {
    addClass: 'hashtag',
    text: tagName,
    on: {
      // attach remove event
      'click': (e) => {
        $(e.currentTarget).remove();
        // to be removed from storage
        let index = draftHashtagsHolder.indexOf(tagName);
        draftHashtagsHolder.splice(index, 1);
      }
    }
  }).get(0))

  // save draft hashtags
  draftHashtagsHolder.push(tagName);
}

const restorePreviousState = () => {
  chrome.storage.local.get(['searchQuery', 'textarea', 'tags', 'timeClosedLastTime', 'scrollY'],
    state => {
      // restore textarea
      if (typeof state.textarea !== 'undefined') {
        draftTextHolder = state.textarea;
        textarea.textContent = state.textarea;
      }
      // restore tagarea
      if (typeof state.tags !== 'undefined') {
        state.tags.forEach(t => {
          addHashtagToDraft(t);
        })
      }
      // restore scrollY position
      if (typeof state.timeClosedLastTime !== 'undefined') {
        const TIME_ELAPSED = 30000;

        let now = new Date().getTime();
        let then = state.timeClosedLastTime;
        let timeElapsed = (now - then);

        if (timeElapsed < TIME_ELAPSED) {
          // restore scrollY
          if (typeof state.scrollY !== 'undefined') {
            scrollYHolder = state.scrollY;
            window.scrollTo(0, scrollYHolder);
          }
          // restore searchbox
          if (typeof state.searchQuery !== 'undefined') {
            fireSearchWithQuery(state.searchQuery);
            searchQueryHolder = $('.searchbox').val();
          }
        }
      }
      //////////
      // restore sort order
    })
}


const initializeEventListeners = () => {

  /* window events */
  window.onunload = () => {
    // save state
    background.chrome.storage.local.set({
      searchQuery: searchQueryHolder,
      textarea: draftTextHolder,
      tags: draftHashtagsHolder
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
    scrollYHolder = window.scrollY;

    chrome.storage.local.set({
      timeClosedLastTime: new Date().getTime(),
      scrollY: scrollYHolder,
    });
  }

  window.addEventListener('blur', () => {
    chrome.runtime.sendMessage({
      command: 'OVERLAY_OFF'
    },
      null
    );
  })

  /* dropdown list */
  dropdownList.addEventListener('mouseleave', hideDropdownList);
  $('header').on('mouseleave', hideDropdownList);

  /* searchbox  */
  $('.searchbox').click(hideDropdownList);
  $('.searchbox').dblclick(showDropdownList);
  $('.searchbox').focus(closeAddTextItemForm);
  $('.searchbox').keyup(selectOnDropdownList);
  $('.searchbox').on('input', updateSearchResult);
  $('.searchcancel-button').click(cancelSearch);

  /* toolbox */
  $('.opener-top').click(openAddTextItemForm);
  $('.fileexport').click(exportTextItems);

  /* add-sort container */
  $('.opener').click(openAddTextItemForm);
  $('.sort-by').click(switchSortOrder);

  /* textarea */
  textarea.addEventListener('focus', (e) => {
    if ($('.searchbox').val().slice(0, 1) === '#' && !draftHashtagsHolder.includes($('.searchbox').val().slice(1))) {
      while (tagarea.lastChild && tagarea.children.length > 1) {
        tagarea.removeChild(tagarea.lastChild);
      }
      draftHashtagsHolder.length = [];

      let tag = $('.searchbox').val().slice(1).split(' ')[0]
      addHashtagToDraft(tag);
    }
    fitHeightToContent(e.target);
    updateTextInfoOnTopboard(e.target.textContent);
  })

  textarea.addEventListener('blur', () => {
    $('.header-board').removeClass('entering');
    $('.header-board').text('')
  })
  textarea.addEventListener('keyup', submitForm);
  textarea.addEventListener('input', updateInputForm)

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

// initialize
document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  renderStack();
  restorePreviousState();

  tagStack = tagStack.sort();
});