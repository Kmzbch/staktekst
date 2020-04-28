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
  draftTags: [],
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
    // termRegex = new RegExp(`\\b(${escapeRegExp(term)})(.*?)\\b`, 'ig');
    termRegex = new RegExp(`(?!<span .+? target="_blank"/>)(${escapeRegExp(term)})(.*?)(?!</span>)`, 'ig');
  }

  Array.from(stackDOM.children)
    .map(textItem => {
      // remove text decoration and highlight
      textItem.firstChild.innerHTML = textItem.firstChild.innerHTML;

      // TODO: implement pinned filter
      if (textItem.textContent.match(termRegex) || textItem.innerHTML.includes('#pinned')) {
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

      // enable URL link
      contentDIV.innerHTML = enableURLEmbededInText(contentDIV.innerText);
      contentDIV.innerHTML = contentDIV.innerHTML.replace(/\n/gi, '<br>');

      if (term.length >= 1) {
        // highlight text except those of pseudo anchor tag
        let linkRegex = new RegExp(`(<span .+? target="_blank">.*?</span>)`, 'i');
        let splitText = contentDIV.innerHTML.split(linkRegex);
        splitText = splitText.map(item => {
          return item.match(linkRegex) ? item : (item.replace(termRegex, "<span class='highlighted'>$1</span>$2"));
        })
        contentDIV.innerHTML = splitText.join('');
      } else {
        // get the text back to the initial state
        contentDIV.innerHTML = enableURLEmbededInText(contentDIV.innerText);
        contentDIV.innerHTML = contentDIV.innerHTML.replace(/\n/gi, '<br>');
      }
    });
  return hits;
};


const selectOnDropdownList = (e) => {
  let liSelected = $('#dropdownlist').find('.selected');
  let unfiltered = $('li').not('.filtered');
  let index = unfiltered.index(liSelected);

  if (e.keyCode === 13) {
    // ENTER
    if (liSelected) {
      liSelected.removeClass('selected');
      fireSearchWithQuery('#' + liSelected.text());
    }
    hideDropdownList()
  } else if (e.keyCode === 38) {
    // UP
    if (!$('#dropdownlist').hasClass('hidden')) {
      if (liSelected) {
        if (index - 1 >= 0) {
          // move up
          liSelected.removeClass('selected');
          $(unfiltered[index - 1]).addClass('selected');
        } else {
          // if no item to select at the top
          hideDropdownList()
        }
      }
    }
  } else if (e.keyCode === 40) {
    // DOWN
    if ($('#dropdownlist').hasClass('hidden')) {
      showDropdownList()
    } else {
      if (liSelected) {
        if (unfiltered.length > index + 1) {
          // move down
          liSelected.removeClass('selected');
          console.log(index);
          $(unfiltered[index + 1]).addClass('selected');
        }
      } else {
        // if no item to select at the bottom
        unfiltered[0].classList.add('selected');
      }
    }
  }
}

const filterDropdownListItems = (tag) => {
  let tagName = tag.trim().toLowerCase().slice(1);
  let termRegex;

  // Search in Japanese/English
  if (containsJapanese(tagName)) {
    termRegex = new RegExp(`^(${escapeRegExp(tagName)})(.*?)`, 'i');
  } else {
    termRegex = new RegExp(`^(${escapeRegExp(tagName)})(.*?)`, 'i');
  }

  $.map($('#dropdownlist').children(),
    (tagItem) => {
      if ($(tagItem).text().match(termRegex)) {
        tagItem.classList.remove('filtered');
      } else {
        tagItem.classList.add('filtered');
      }
      return tagItem;
    })
}

const setDropdownListItems = () => {
  // empty selections
  $('#dropdownlist').empty();

  tagStack = tagStack.slice(0, 3).concat(tagStack.slice(3).sort());

  // create list from tagStack
  tagStack
    .filter(item => isNaN(Date.parse(item))) // filter duedate tag
    .forEach(tag => {
      if (tag !== '') {
        let liItem = $('<li>', {
          text: tag,
          // text: tag,
          on: {
            mouseover: (e) => {
              // work as hover
              let liSelected = $('#dropdownlist').find('.selected');
              $(e.target).addClass('selected');
            },
            mouseleave: (e) => {
              // work as hover
              let liSelected = $('#dropdownlist').find('.selected');
              if (liSelected) {
                liSelected.removeClass('selected');
              }
            },
            click: (e) => {

              if (e.target.classList.contains('tag-editIcon')) {
                e.preventDefault();
                let liSelected = $('#dropdownlist').find('.selected');
                let orgHTML = liSelected.html();
                $(liSelected).empty();
                let editTagInput = $('<input>', {
                  type: 'text',
                  addClass: 'tageditInput tagadd',
                  on: {
                    keyup: (e) => {
                      if (e.keyCode === 13) {
                        if (e.target.value !== '') {
                          //ESC
                          e.target.blur();
                        }
                      }
                    },
                    blur: (e) => {
                      if (e.target.value === '') {
                        $(liSelected).empty();
                        $(liSelected).html(orgHTML);
                      } else {
                        // replace with new tag
                        let newTag = e.target.value;
                        orgHTML = orgHTML.replace(tag, newTag)
                        $(liSelected).empty();
                        $(liSelected).html(orgHTML);
                        replaceTagName(tag, newTag);
                        $('.tag').each((index, elem) => {
                          if ($(elem).text() === '#' + tag) {
                            $(elem).text('#' + newTag)
                          }
                        })
                        tagStack.slice(tagStack.findIndex(t => t === tag), 1, newTag);
                        //                        fireSearchWithQuery('#' + newTag);
                        if ($('.searchbox').val() !== "") {
                          $('.searchbox').val('#' + newTag);
                          windowState.searchQuery = '#' + newTag;
                        }
                        tag = newTag;
                        // renderStack();

                      }
                    }
                  }
                });
                editTagInput.appendTo(liSelected);

                $('.tageditInput').val(tag);
                $('.tageditInput').focus();



                return false;
              } else if (e.target.classList.contains('tageditInput')) {
                e.preventDefault();
                return false;
              } else {
                fireSearchWithQuery('#' + $(e.target).text().replace(/edit$/, ''));
                hideDropdownList();

              }

            },
          }
        });

        if (!['note', 'bookmark', 'clip'].includes(tag)) {
          let editIcon = document.createElement('i');
          editIcon.classList.add('material-icons');
          editIcon.classList.add('tag-edit');
          editIcon.classList.add('tag-editIcon');
          editIcon.innerText = 'edit';
          liItem.append(editIcon);
        }

        $('#dropdownlist').append(liItem)

      }
    })
}

const replaceTagName = (oldTag, newTag) => {
  // add item to stack
  stack.forEach(item => {
    if (item.type != 'clip') {
      if (item.footnote.tags.includes(oldTag)) {
        item.footnote.tags.splice(item.footnote.tags.findIndex(tag => tag == oldTag), 1, newTag)
      }
    }
  })

  stackStorage.set(JSON.stringify(stack));

}

const exportTextItems = () => {
  // get text items to export
  let textitemIDs = $.map(
    $(stackDOM.children).not('.date, .filtered'),
    (item, index) => {
      return $(item).attr('id')
    })

  // create exporting content
  let content = Array.from(stack)
    .filter(item => textitemIDs.includes(item.id))
    .reduce((accm, item) => {

      // for urls
      let sanitizedContent = $('<div>', {
        html: item.content
      }).text();

      accm += `${sanitizedContent}\n`;
      if (typeof item.footnote.pageTitle !== 'undefined') {
        accm += item.footnote.pageTitle + '\n';
      }
      if (typeof item.footnote.url !== 'undefined') {
        accm += item.footnote.url + "\n";
      }
      return accm += '\n';
    }, "")

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

      // clear form and holders to the initial state
      $('.add-textitem').val('');

      windowState.draftText = '';
      // windowState.draftHashtags = [];
      windowState.draftTags = [];

      switchTextareaSize(e, true);

      // display system message
      displayMessage('Item Added!');
      setTimeout(() => {
        updateTextInfoMessage($('.add-textitem').val());
      }, 700);

      return false;
    }
  }
};


function updateInputForm(e) {
  $('.error').remove();

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
      addDraftTag(hashtags[2].slice(1))
      windowState.draftTags.push(hashtags[2].slice(1));
    }
  }

  windowState.draftText = e.target.value.trim();

  fitHeightToContent(textarea);
  updateTextInfoMessage($('.add-textitem').val());

}

function removeTextItem(textitemDOM) {
  // apply visual effects and display Message
  textitemDOM.classList.add('removed')

  displayMessage("Item Removed!");
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

  // TODO: implment pin feature
  // $('<i>', {
  //   addClass: 'fas fa-thumbtack fa-lg pin',
  //   on: {
  //     click: (e => {
  //       if ($(e.target).hasClass('pinned')) {
  //         $(e.target).removeClass('pinned');
  //       } else {
  //         $(e.target).addClass('pinned');
  //       }
  //     })
  //   }
  // }).insertAfter(editIcon);



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
    // editing mode styles
    wrapper.classList.add('editing');

    // remove a tag
    Array.from(contentDIV.childNodes).forEach((item) => {
      $(item).contents().unwrap()
    }, '')

    // move caret to the end of the text
    const node = contentDIV.childNodes[contentDIV.childNodes.length - 1]
    const editorRange = document.createRange()
    const editorSel = window.getSelection()
    editorRange.setStart(node, node.length)
    editorRange.collapse(true)
    editorSel.removeAllRanges()
    editorSel.addRange(editorRange)
  })

  wrapper.addEventListener('focusout', (e) => {
    // enable URL
    contentDIV.contentEditable = false;
    contentDIV.innerHTML = enableURLEmbededInText(contentDIV.innerText);

    // replace new lines with br tag
    contentDIV.innerHTML = contentDIV.innerHTML.replace(/\n+$/i, '');
    contentDIV.innerHTML = contentDIV.innerHTML.replace(/\n/gi, '<br>');

    // leave edit mode
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
    let id = $(e.target).attr('id');

    let newHTML = contentDIV.innerHTML.replace(/<br>$/, '');
    updateTextInfoMessage(newHTML);

    // update teext item
    let index = stack.findIndex(item => item.id === id);
    stack[index].content = newHTML.replace(/<br>/ig, '\n');
    stackStorage.set(JSON.stringify(stack));
  })

  // ctrl + Enter to end editing
  wrapper.addEventListener('keydown', (e) => {
    if (e.keyCode === 13 && e.ctrlKey) {
      fireChange(e);
      wrapper.dispatchEvent(new Event('focusout'));
    }
  });


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

  stackWrapper.innerHTML = `<div class='content'>${content}</div><i class="material-icons checkbox">check</i><input type="hidden" value="${id}"><input class='itemDate' type='hidden' value="${date}"><div class="spacer"></div><div class="footnote"></div>`;

  $('#textstack').append(stackWrapper);

  content = $('<div>', {
    html: content
  }).text();

  // content
  // enable URL link
  let contentDIV = stackWrapper.firstElementChild;
  contentDIV.innerHTML = enableURLEmbededInText(content);
  contentDIV.innerHTML = contentDIV.innerHTML.replace(/\n/gi, '<br>');

  // foot note
  if (type === 'clip') {
    // stackWrapper.querySelector('.footnote').innerHTML = `<span class="tag clip hidden">#clip</span><span class="pseudolink" href="${footnote.pageURL}" target="_blank">${footnote.pageTitle}</span>`;
    stackWrapper.querySelector('.footnote').innerHTML = `<span class="tag clip hidden">#clip</span><span class="pseudolink" href="${footnote.pageURL}" target="_blank">${footnote.pageTitle}</span>`;
  } else {
    stackWrapper.querySelector('.footnote').innerHTML = `<span class="tag">#${type}</span>`;
    if (type === 'note') {
      attachContentEditableEvents(stackWrapper);
    }
  }


  // TAGS
  if (typeof footnote.tags !== 'undefined') {
    footnote.tags.forEach(item => {
      if (!['note', 'clip', 'bookmark'].includes(item)) {
        $('<span>', { addClass: 'tag', text: '#' + item })
          .appendTo($(stackWrapper).find('.footnote'));
        if (!tagStack.includes(item)) {
          tagStack.push(item);
        }
      }
    })
  }

  if (stackWrapper.querySelector('.footnote').childNodes.length < 5 && type != 'clip') {
    let divWrap = $('<div>', { addClass: 'divWrap' })
    divWrap.appendTo($(stackWrapper).find('.footnote'));


    let input = $('<input>', {
      type: 'text',
      addClass: 'tagadd',
    });

    divWrap.append(input);

    // attach events
    input.blur((ev) => {
      let tagName = ev.target.value.trim();
      if (tagName !== '') {
        // find the index of the text item
        let index = stack.findIndex(item => item.id === $(stackWrapper).attr('id'));
        // update Tag
        if (typeof stack[index].footnote.tags === 'undefined') {
          stack[index].footnote.tags = [];
        }
        stack[index].footnote.tags.push(tagName);
        stackStorage.set(JSON.stringify(stack));
        // 
        $('<span>', {
          addClass: 'tag',
          text: '#' + tagName
        }).insertBefore(divWrap);

        // 
        if (!tagStack.includes(tagName)) {
          tagStack.push(tagName);
        }
        ev.target.value = '';
        if ($(stackWrapper).find('.tag').length >= 6) {
          divWrap.addClass('hidden');
        }
      }
    });

    input.keyup(
      (ev) => {
        ev.preventDefault();

        let tagName = ev.target.value;
        if (tagName.slice(tagName.length - 1) === ' ' || ev.keyCode === 13) {
          tagName = ev.target.value.trim();
          if (tagName !== '') {
            // find the index of the text item
            let index = stack.findIndex(item => item.id === $(stackWrapper).attr('id'));

            // update Tag
            if (typeof stack[index].footnote.tags === 'undefined') {
              stack[index].footnote.tags = [];
            }

            stack[index].footnote.tags.push(tagName);
            stackStorage.set(JSON.stringify(stack));

            // 
            $('<span>', {
              addClass: 'tag',
              text: '#' + tagName
            }).insertBefore(divWrap);

            // 
            if (!tagStack.includes(tagName)) {
              tagStack.push(tagName);
            }
            ev.target.value = '';
            if ($(stackWrapper).find('.tag').length >= 6) {
              divWrap.addClass('hidden');
            }
          }
        } else if (ev.keyCode === 8 && tagName === '') {
          let tagInput = ev.target;
          let prevTag = $(tagInput).parent().prev();
          if ($(stackWrapper).find('.tag').length > 1) {
            // remove tag from footnote
            let prevTagName = prevTag.text();
            let prevStackWrapper = prevTag.parent().parent();

            // find the id of the previous tag
            let index = stack.findIndex(item => item.id === $(prevStackWrapper).attr('id'));
            let tagIndex = stack[index].footnote.tags.indexOf(prevTagName);

            // remove the previous tag
            stack[index].footnote.tags.splice(tagIndex, 1);
            stackStorage.set(JSON.stringify(stack));
            prevTag.remove();

            // set
            $(tagInput).val(prevTagName.slice(1));
            $(tagInput).trigger('focus');
          }
        }
      });
  }
}

/**
 * insert date as a separator
 */
const insertDateSeparator = () => {
  $(stackDOM.children).each((index, wrapper) => {
    let date = $(wrapper).find('.itemDate').val();

    if (dateStack.length === 0) {
      $('<div>', {
        addClass: 'date',
        text: date
      }).insertBefore(wrapper)
      dateStack.push(date);
    } else {
      // insert only between the date and the previous date
      if (dateStack[dateStack.length - 1] !== date) {
        $('<div>', {
          addClass: 'date',
          text: date
        }).insertBefore(wrapper)
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
  }).appendTo(stackDOM);

}

/**
 * Initialize events listners
 */
const initializeEventListeners = () => {
  /* window events */
  window.onscroll = () => {
    // show header and footer when scrolling to the top/bottom
    if (window.pageYOffset == 0) {
      $('header').css('opacity', 1)
      $('footer').css('opacity', 1)
    } else if ($('body').offsetHeight + window.scrollY >= $('body').scrollHeight) {
      $('header').css('opacity', 1)
      $('footer').css('opacity', 1)
    } else {
      $('header').css('opacity', 0)
      $('footer').css('opacity', 0)
    }
    // save scrollY position
    windowState.scrollY = window.scrollY;
  }

  $(window).on('unload blur', () => {
    windowState.closedDateTime = new Date().toJSON();
    chrome.extension.getBackgroundPage().chrome.storage.local.set(windowState);
    chrome.runtime.sendMessage({
      command: 'OVERLAY_OFF'
    });
  })

  /* header */
  /* dropdown list */
  $('#dropdownlist, header').on('mouseleave', hideDropdownList);

  /* searchbox  */
  $('.searchbox').on({
    click: hideDropdownList,
    dblclick: showDropdownList,
    focus: closeAddTextItemForm,
    keyup: selectOnDropdownList,
    input: updateSearchResult
  })
  $('.searchcancel-button').click(cancelSearch);

  /* toolbox & text area*/
  // $('.opener-top').click(openAddTextItemForm);
  // create empty note for testing
  $('.opener-top').click(() => {
    //
    let id = uuidv4();
    let type = 'note';
    let footnote = {
      tags: []
    };
    // add the current tag in the seachbox
    let searchQuery = $('.searchbox').val();
    if (searchQuery[0] === '#' && searchQuery.length > 0) {
      footnote.tags.push(searchQuery.substring(1))
    }
    let date = formatDate();

    // add item to stack
    stack.push({
      id: id,
      type: type,
      content: "",
      date: date,
      footnote: footnote,
    });
    stackStorage.set(JSON.stringify(stack));

    renderTextItem(id, type, "", footnote, date);
  });

  $('.fileexport').click(exportTextItems);

  $('.header-board').click(switchToolboxVisibility)
  /* textarea */
  $('.opener').click(openAddTextItemForm);
  $('.sort-by').click(() => { sortTextItems(!windowState.sortedByNew) });
  $('.add-textitem').on({
    keyup: submitForm,
    input: updateInputForm,
    blur: () => {
      $('.header-board').removeClass('entering');
      $('.header-board').text('')
    },
    focus: (e) => {
      // add draft tag when searchbox having tag query
      if ($('.searchbox').val().slice(0, 1) === '#'
        && !windowState.draftTags.includes($('.searchbox').val().slice(1))) {
        while (tagarea.lastChild && tagarea.children.length > 1) {
          tagarea.removeChild(tagarea.lastChild);
        }
        addDraftTag($('.searchbox').val());

      }
      fitHeightToContent(e.currentTarget);
      updateTextInfoMessage($('.add-textitem').val());
    }
  })
  $('.size-changer').click(switchTextareaSize);

  /**
   * the text stack dynamically changes
   */
  $('#textstack').click((e) => {
    let targetElem = e.target;
    // TAG
    if ($(targetElem).hasClass('tag')) {
      if (e.ctrlKey && $(targetElem).hasClass('removing')) {
        let tagName = $(targetElem).text();
        let stackWrapper = $(targetElem).parent().parent();

        if (stackWrapper.find('.tag').length > 1) {
          // remove tag from footnote
          let id = stackWrapper.find('input').val();
          let index = stack.findIndex(item => item.id === id);
          let tagIndex = stack[index].footnote.tags.indexOf(tagName);
          // remove the tag
          stack[index].footnote.tags.splice(tagIndex, 1);
          stackStorage.set(JSON.stringify(stack));
          // remove item in the UI
          $(targetElem).remove();
          stackWrapper.find('.footnote')
            .find('.divWrap').removeClass('hidden');
        }
      } else {
        // when hashtag clicked
        fireSearchWithQuery($(targetElem).html());
        // stay at the position
        let stackWrapper = $(targetElem).parent().parent();
        let id = stackWrapper.find('input').val();
        let prevYOffset = window.pageYOffset;
        location.href = '#' + id;
        if (window.pageYOffset < window.offsetHeight) {
          window.scrollTo(0, 0);

        } else {
          window.scrollTo(0, prevYOffset);
        }

      }
      // CHECKBOX
    } else if ($(targetElem).hasClass('checkbox')) {
      // when checkbox clicked
      $(targetElem).css('color', 'white !important')
      let textItem = $(targetElem).parent().get(0);
      removeTextItem(textItem);
      // PSEUDOLINK
    } else if ($(targetElem).hasClass('pseudolink')) {
      // use span tag as a link
      // open url in a background with Ctrl key
      chrome.tabs.create({
        url: $(targetElem).attr('href'),
        active: e.ctrlKey ? false : true
      })
      return false;
    }
    else {
      closeAddTextItemForm();
    }
  });

  $('#textstack').on({
    mouseover: (e) => {
      if ($(e.target).hasClass('tag')) {
        if (!['note', 'clip', 'bookmark'].includes($(e.target).text().slice(1))) {
          if (e.ctrlKey && !$(e.target).hasClass('removing')) {
            $(e.target).addClass('removing');
          }
        }
      }
    },
    mouseout: (e) => {
      if ($(e.target).hasClass('tag')) {
        if (!['note', 'clip', 'bookmark'].includes(e.target.textContent.slice(1))) {
          $(e.target).removeClass('removing');
        }
      }
    },
  })


  /* footer & modal */
  $('.clear-button').click(showClearStackWindow);
  $('.overlay').click(hideClearStackWindow);
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

const switchToolboxVisibility = (forseVisible = false) => {
  if (forseVisible) {
    $('.header-board').text('');
    $('#toolbox').removeClass('hidden');
  } else {
    $('#toolbox').addClass('hidden');
  }
}

const displayMessage = (message) => {
  if ($('.header-board').hasClass('entering')) {
    $('.header-board').removeClass('entering');
  }
  $('.header-board').text(message);

  switchToolboxVisibility(false);
}

const updateTextInfoMessage = (text) => {
  switchToolboxVisibility(false);

  let info = extractTextInfo(text);
  $('.header-board').html(
    `${info.wordCount} words<span class="inlineblock">${info.charCount} chars</span>`
  );

  if (!$('.header-board').hasClass('entering')) {
    $('.header-board').addClass('entering');
  }
}

const sortTextItems = (sortingByNew) => {
  // NEW
  if (sortingByNew) {
    $('.sort-by').html('New <i class="material-icons">arrow_upward</i>');
    $('#textstack').css('flexDirection', 'column-reverse')
    // OLD
  } else {
    $('.sort-by').html('Old <i class="material-icons">arrow_downward</i>');
    $('#textstack').css('flexDirection', 'column')
  }
  windowState.sortedByNew = sortingByNew;
}

const openAddTextItemForm = () => {
  switchToolboxVisibility(false);
  // HIDE
  $('.opener').addClass('hidden');
  $('.sort-by').addClass('hidden');
  // SHOW
  $('.add-textitem').removeClass('hidden');
  $('.tagarea').removeClass('hidden');
  // focus
  $('.add-textitem').trigger('focus');
}

const closeAddTextItemForm = () => {
  switchToolboxVisibility(true);
  // HIDE
  $('.add-textitem').addClass('hidden');
  $('.tagarea').addClass('hidden');
  // SHOW
  $('.opener').removeClass('hidden');
  $('.sort-by').removeClass('hidden');
  $('.header-board').removeClass('entering');
  // turn off overlay
  chrome.runtime.sendMessage({
    command: 'OVERLAY_OFF'
  });
}

const addDraftTag = (tagName) => {
  // sanitize tag
  tagName = tagName.replace(/^#|\s+$/g, '');
  // create tag
  $(tagarea).append($('<span>', {
    addClass: 'hashtag',
    text: tagName,
    on: {
      // attach remove event
      'click': (e) => {
        $(e.currentTarget).remove();
        let index = windowState.draftTags.indexOf(tagName);
        windowState.draftTags.splice(index, 1);
      }
    }
  }))
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
        if (typeof res.footnote.tags === 'undefined') {
          res.footnote["tags"] = [];
        }
        renderTextItem(res.id, type, res.content, res.footnote, res.date);
      });
      insertDateSeparator();
    }
  });

};

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

  updateTextInfoMessage($('.add-textitem').val())

  // change textarea size and icon
  $('.add-textitem').css({
    height: config.height,
    minHeight: config.minHeight
  })
  sizeChangerIcon.text(config.icon);

  // turn on/off overlay of the current tab
  chrome.runtime.sendMessage({
    command: config.command
  });
}

/**
 * Restore the previous popup window state
 * 
 */
const restorePreviousState = () => {
  chrome.storage.local.get(['searchQuery', 'draftText', 'draftTags', 'scrollY', 'closedDateTime', 'sortedByNew'],
    state => {
      windowState = state;

      let timeElapsed = typeof state.closedDateTime !== 'undefined'
        ? (new Date() - new Date(state.closedDateTime)) : 30000;

      if (timeElapsed < 30000) {
        // restore textarea
        if (typeof state.draftText !== 'undefined') {
          $('.add-textitem').text(state.draftText);
        }
        // restore tagarea
        if (typeof state.draftTags !== 'undefined') {
          state.draftTags.forEach(tag => {
            addDraftTag(tag);
          })
        }
        // restore searchbox
        if (typeof state.searchQuery !== 'undefined') {
          fireSearchWithQuery(state.searchQuery);
        }
        // restore sort order
        if (typeof state.sortedByNew !== 'undefined') {
          sortTextItems(state.sortedByNew)
        }
        // restore scrollY
        if (typeof state.scrollY !== 'undefined') {
          window.scrollTo(0, state.scrollY);
        }
      }
    })
}

// initialize
document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  renderStack();
  restorePreviousState();
});

