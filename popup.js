// configration
const config = {
  CACHE_DURATION: 30000
}

// background.js instance
const background = chrome.extension.getBackgroundPage();

// state variables
let stack = [];
let tagStack = ['bookmark', 'clip', 'note'];
let dateStack = [];
let windowState = {
  searchQuery: '',
  scrollY: 0,
  sortedByNew: true
}

// seach optimization
let shadowNodes = [];

const doTaskOnceInputIsDone = (task, time) => {
  // clear timeout of undone task
  if (task in doTaskOnceInputIsDone.TID) {
    window.clearTimeout(doTaskOnceInputIsDone.TID[task])
  }
  //
  doTaskOnceInputIsDone.TID[task] = window.setTimeout(
    () => {
      // clear task ID previously registered
      delete doTaskOnceInputIsDone.TID[task];
      try {
        task.call();
      } catch (e) {
        console.log('EXCEPTION: ' + task)
      }
    }, time);
}

doTaskOnceInputIsDone.TID = {}

/**
 * 
 */
const updateSearchResult = () => {
  let query = $('.searchbox').val().trim().toLowerCase();
  let hits;

  // save when the search result updated
  windowState.searchQuery = query;

  // if the query is a tag
  // TODO: consider what special search tags to use
  if (query[0] === '#') {
    hits = filterNoteItemsByTag(query);
    $('.separator').each((index, item) => {
      if ($(item).find('.tag').text() === query) {
        if (item.classList.contains('filtered')) {
          console.log("?????");
          item.classList.remove('filtered');
        }
      }
    })
    //
    $('.opener').show();
  } else if (query === ':d') {
    hits = filterNoteItemsWithDateTag(query);
    $('.opener').hide();
  } else {
    hits = filterNoteItems(query);
    $('.opener').hide();
  }
  filterDropdownListItems(query);

  sortable.save();

  // change styles on search
  if (query) {
    // set text
    $('#statusboard').text(hits === 0 ? 'No Results' : `${hits} of ${stack.length}`)
    // show/hide
    $('#toolbox').hide();
    $('.search-cancel-button').show();
    $('footer').hide();

    //
    setTimeout(() => {
      // reset
      $('#statusboard').text('');
      // show/hide
      $('#toolbox').show();
    }, 5000);

  } else {
    // reset
    $('#statusboard').text('');
    // show/hide
    $('#toolbox').show();
    $('.search-cancel-button').hide();
    $('footer').show();
    hideDropdownList();
  }
}

/**
 * 
 */
const filterNoteItemsByTag = (tagName) => {

  if (tagName[0] === '#') {
    tagName = tagName.substring(1);
  }

  let hits = 0;
  const tagRegex = new RegExp(`^${escapeRegExp(tagName)}`, 'i');

  $('#textstack').children().each((index, textItem)=>{
    // filter date item
    if ($(textItem).hasClass('date')) {
      textItem.classList.add('filtered');
    } else {
      $(textItem).find('.tag').each((index, tag) => {
        if ($(tag).text().match(tagRegex)) {
                // filter date item
      textItem.classList.remove('filtered');
      hits++;
          return false;
        } else {
          textItem.classList.add('filtered');
        }
      })
    }
  })
  
  return hits;
}

const filterNoteItemsWithDateTag = (dateTag) => {
  let hits = 0;

  $('#textstack').children().each((index, textItem)=>{
    if ($(textItem).hasClass('date')) {
      textItem.classList.add('filtered');
    } else {
      $(textItem).find('.tag').each((index, tag) => {
        if (!isNaN(Date.parse($(tag).text()))) {
          textItem.classList.remove('filtered');
          hits++;
          return false;
        } else {
          textItem.classList.add('filtered');
        }
      })
    }
  })
  return hits;
}


/**
 * 
 */
const filterNoteItems = (term) => {
  let stackDOM = document.querySelector('#textstack');
  let termRegex;
  let hits = 0;

  // Search in Japanese/English
  if (containsJapanese(term)) {
    termRegex = new RegExp(`(${escapeRegExp(term)})`, 'i');
  } else {
    termRegex = new RegExp(`(?!<span .+? target="_blank"/>)(${escapeRegExp(term)})(.*?)(?!</span>)`, 'i');
  }

  Array.from(stackDOM.children)
    .map(textItem => {
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
      // enable URL link
      contentDIV.innerHTML = enableURLEmbededInText(contentDIV.innerText);
      contentDIV.innerHTML = contentDIV.innerHTML.replace(/\n/gi, '<br>');

      if (term.length >= 1) {
        $(contentDIV).highlight(term, { element: 'span', className: 'highlighted' });
      } else {
        // UNUSED
        // // get the text back to the initial state
        // contentDIV.innerHTML = enableURLEmbededInText(contentDIV.innerText);
        // contentDIV.innerHTML = contentDIV.innerHTML.replace(/\n/gi, '<br>');
      }
    });

  return hits;
};



/**
 * 
 */
const selectOnDropdownList = (e) => {
  let liSelected = $('#tagsearch-result').find('.selected');
  let unfiltered = $('li').not('.filtered');
  let index = unfiltered.index(liSelected);

  if (e.keyCode === 13) {
    if (!$('#tagsearch-result').is(":hidden")) {
      // ENTER
      if (liSelected) {
        liSelected.removeClass('selected');
        fireNoteSearch('#' + liSelected.text().replace(/edit$/, ''));
      }
      hideDropdownList()

    }
  } else if (e.keyCode === 38) {
    // UP
    if (!$('#tagsearch-result').is(":hidden")) {
      if (liSelected) {
        if (index - 1 >= 0) {
          // move up
          liSelected.removeClass('selected');
          $(unfiltered[index - 1]).addClass('selected');

          // scroll
          const newLiSelectedY = $(unfiltered[index - 1]).position().top;
          const newLiSelectedHeight = $(unfiltered[index - 1]).innerHeight();
          const innerHeight = $('#tagsearch-result').position().top;
          const scrollTop = $('#tagsearch-result').scrollTop();

          if (newLiSelectedY <= (innerHeight) - newLiSelectedHeight) {
            $('#tagsearch-result').animate({ scrollTop: scrollTop - (scrollTop % newLiSelectedHeight) - newLiSelectedHeight }, 20);
          }

        } else {
          // if no item to select at the top
          hideDropdownList()
        }
      }
    }
  } else if (e.keyCode === 40) {
    // DOWN
    if ($('#tagsearch-result').is(":hidden")) {
      if ($('li.flitered').length > 0 || $('.searchbox').val() === "") {
        showDropdownList()
      }
    } else {
      if (liSelected) {
        if (unfiltered.length > index + 1) {
          // move down
          liSelected.removeClass('selected');
          $(unfiltered[index + 1]).addClass('selected');

          // scroll
          const newLiSelectedY = $(unfiltered[index + 1]).position().top;
          const newLiSelectedHeight = $(unfiltered[index + 1]).height();
          const innerHeight = $('#tagsearch-result').innerHeight();
          const scrollTop = $('#tagsearch-result').scrollTop();

          if (newLiSelectedY > (innerHeight) - newLiSelectedHeight) {
            $('#tagsearch-result').animate({ scrollTop: $('#tagsearch-result').position().top + scrollTop + ((scrollTop % newLiSelectedHeight) + newLiSelectedHeight) }, 0);
          }

        }
      } else {
        // if no item to select at the bottom
        unfiltered[0].classList.add('selected');
      }
    }
  }
}




/**
 * 
 */
const filterDropdownListItems = (query) => {
  const tagName = query.trim()[0] === "#" ? query.trim().toLowerCase().slice(1) : query.trim().toLowerCase();
  const termRegex = new RegExp(`^(${escapeRegExp(tagName)})(.*?)`, 'i');
  $.map($('#tagsearch-result').children(),
    (listItem) => {
      if ($(listItem).text().match(termRegex)) {
        listItem.classList.remove('filtered');
      } else {
        listItem.classList.add('filtered');
      }
      return listItem;
    })
}



/**
 * 
 */
const setDropdownListItems = () => {
  // empty selections
  $('#tagsearch-result').empty();

  let defaultTagStack = tagStack.slice(0, 3);
  let emojiTagStack = tagStack.filter((tag) =>
    tag.match(/\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu)
  );

  let customTagStack = tagStack.slice(3).filter((tag) =>
    !tag.match(/\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu)
  );

  tagStack = defaultTagStack.concat(customTagStack.sort()).concat(emojiTagStack.sort());

  // create list from tagStack
  tagStack
    .filter(item => isNaN(Date.parse(item))) // filter duedate tag
    .forEach(tag => {
      if (tag !== '') {
        // create list item
        let liItem = $('<li>');

        liItem.append(
          $('<span>', {
            text: tag,
          })
        )

        // append edit Icon to list item
        if (!['note', 'bookmark', 'clip'].includes(tag)) {
          let editTagInput = $('<input>', {
            type: 'text',
            addClass: 'tageditInput tagadd',
            value: tag,
            spellCheck: 'false',
            css: {
              display: 'none'
            }
          });
          //

          // events
          editTagInput.keyup((e) => {
            if (e.keyCode === 13) {
              // ENTER
              let newTag = e.target.value;
              let oldTag = e.target.defaultValue;
              if (newTag.match(/^\s*$/)) {
                newTag = oldTag;

              } else {
                replaceTagName(oldTag, newTag);
                $('.tag').each((index, elem) => {
                  if ($(elem).text() === oldTag) {
                    $(elem).text(newTag)
                  }
                })

                if (tagStack.findIndex(t => t === newTag) === -1) {
                  tagStack.splice(tagStack.findIndex(t => t === oldTag), 1, newTag);
                } else {
                  tagStack.splice(tagStack.findIndex(t => t === oldTag), 1);
                }

                e.target.defaultValue = newTag;

                // for search optimization
                if (shadowNodes[0]) {
                  $(shadowNodes[0]).find('.tag').each((index, elem) => {
                    if ($(elem).text() === oldTag) {
                      $(elem).text(newTag)
                    }
                  })
                }
              }

              $(e.target).parent().find('span').text(newTag);
              $(e.target).parent().find('span').show();
              $(e.target).parent().find('.tagedit').show();
              $(e.target).hide();

              if ($('.searchbox').val() !== '') {
                $('.searchbox').val('#' + newTag);
                windowState.searchQuery = '#' + newTag;
              }

            }
          })


          //
          liItem.append(
            editTagInput
          );

          liItem.append(
            $('<i>', {
              addClass: 'material-icons tagedit',
              text: 'edit'
            }));
        }
        $('#tagsearch-result').append(liItem)

        // atach events for selected item
        liItem.on({
          mouseover: (e) => {
            // work as hover
            $(e.target).addClass('selected');
          },
          mouseleave: (e) => {
            // work as hover
            let liSelected = $('#tagsearch-result').find('.selected');
            if (liSelected) {
              liSelected.removeClass('selected');
            }
          },
        })

        //
        liItem.click((e) => {
          if (e.target.classList.contains('tagedit')) {
            e.preventDefault();

            let liSelected = $('#tagsearch-result').find('.selected');
            let orgTag = liSelected.find('span').text();

            $(liSelected).find('span').hide();
            $(e.target).hide();
            $(liSelected).find('.tageditInput').show();
            $(liSelected).find('.tageditInput').focus();
            let val = $(liSelected).find('.tageditInput').val();
            $(liSelected).find('.tageditInput').val('')
            $(liSelected).find('.tageditInput').val(val)


            return false;
          } else if (e.target.classList.contains('tageditInput')) {
            e.preventDefault();

            return false;
          } else {
            fireNoteSearch('#' + $(e.target).text().replace(/edit$/, ''));
            hideDropdownList();
          }
        })
      }
    })
}

/**
 * generate note item HTML
 */
const generateNoteItemHTML = ({ id, type, content, footnote, date }) => {
  // add the most outer opening tag
  let noteItemHTML = `<div class="stackwrapper ${type}" id="${id}">`

  // add content body
  noteItemHTML += `<div class='content'>${enableURLEmbededInText(content).replace(/\n/gi, '<br>')}</div><i class="material-icons edit">edit</i><div><i class="material-icons checkbox">check</i></div><input type="hidden" value="${id}"><input class='itemDate' type='hidden' value="${date}"><div class="spacer"></div>`;

  // add footnote
  if (type === 'clip') {
    noteItemHTML += `<div class="footnote"><span class="pseudolink" href="${footnote.pageURL}" target="_blank">${footnote.pageTitle}</span><span class="tag type clip">clip</span>`;
  } else {
    noteItemHTML += `<div class="footnote"><span class="tag type">${type}</span>`;
  }

  // add tags to footnote
  let tagsHTML = "";

  if (typeof footnote.tags !== 'undefined') {
    footnote.tags.forEach(tagName => {
      // change the tag to emoji
      if (tagName.match(/pinned|📌/i)) {
        tagName = tagName.replace(/pinned/i, '📌');
      }
      tagsHTML += generateTagsHTML(tagName);
    })
  }

  noteItemHTML += tagsHTML

  // omit input of tag addition
  // TODO: rename tagadd class
  if (footnote.tags.length < 4) {
    noteItemHTML += '<div class="divWrap"><input type="text" class="tagadd"></div>';
  } else {
    noteItemHTML += '<div class="divWrap hidden"><input type="text" class="tagadd"></div>';
  }

  // add the closing tag of footnote
  noteItemHTML += "</div>";

  // replace class names for setting styles
  if (noteItemHTML.match(/pinned|📌/i)) {
    noteItemHTML = noteItemHTML.replace(/stackwrapper/ig, "stackwrapper pinned");
  }

  // add the most outer closing tag
  noteItemHTML += "</div>"

  return noteItemHTML;
}


/**
 * 
 */
const generateTagsHTML = (tagName) => {
  let tagsHTML = "";

  // add classes for special tags
  if (tagName.match(/pinned|📌/i)) {
    // pinned
    tagsHTML = `<span class="tag pinned emoji">${tagName}</span>`
  } else if (tagName.match(/fav|★|☆|✭|⭐/i)) {
    // favourite
    // tagsHTML = `<span class="tag fav">${tagName}</span>`
    tagsHTML = `<span class="tag fav">⭐</span>`
  } else if (tagName.match(/like|♡|💛|♥|❤/i)) {
    // likes
    // tagsHTML = `<span class="tag like">${tagName}</span>`
    tagsHTML = `<span class="tag like">❤</span>`
  } else if (
    tagName.match(/\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu
    )) {
    // emoji
    tagsHTML = `<span class="tag emoji">${tagName}</span>`
  } else if (tagName === "today") {
    tagsHTML = `<span class="tag tagDate">${formatDate()}</span>`
  } else if (!isNaN(new Date(tagName))) {
    // datetag
    // TODO: rename tagDate class
    tagsHTML = `<span class="tag tagDate">${tagName}</span>`
  } else {
    tagsHTML = `<span class="tag">${tagName}</span>`
  }
  // save tags for tag search
  if (!tagStack.includes(tagName)) {
    tagStack.push(tagName);
  }

  return tagsHTML;
}

/**
 * 
 */
const attachTagInputEvents = (stackWrapper) => {
  // BLUR event
  $(stackWrapper).find('.tagadd').blur(
    (ev) => {
      ev.preventDefault();
      let tagName = ev.target.value.trim();
      if (tagName !== '') {
        // update tag information
        const index = stack.findIndex(item => item.id === $(stackWrapper).attr('id'));

        if (typeof stack[index].footnote.tags === 'undefined') {
          stack[index].footnote.tags = [];
        }

        stack[index].footnote.tags.push(tagName);
        stackStorage.set(JSON.stringify(stack));

        // change the tag to emoji
        if (tagName.match(/pinned|📌/i)) {
          tagName = tagName.replace(/pinned/i, '📌');
          $(stackWrapper).addClass('pinned');
        }

        // 
        let tagsHTML = generateTagsHTML(tagName);

        // insert before tag input
        // TODO: rename divWrap class
        let divWrap = $(stackWrapper).find('.divWrap');
        divWrap.get(0).insertAdjacentHTML("beforebegin", tagsHTML);

        // reset value
        ev.target.value = '';

        // toggle divWrap visibility
        if ($(stackWrapper).find('.tag').length >= 6) {
          divWrap.addClass('hidden');
        } else {
          divWrap.removeClass('hidden');
        }
      }
    },
  )


  // KEYUP
  $(stackWrapper).find('.tagadd').keyup(
    (ev) => {
      ev.preventDefault();

      let tagName = ev.target.value;

      if (tagName[tagName.length - 1] === ' ' || ev.keyCode === 13) {

        tagName = ev.target.value.trim();

        if (tagName !== '') {

          // update tag information
          const index = stack.findIndex(item => item.id === $(stackWrapper).attr('id'));

          if (typeof stack[index].footnote.tags === 'undefined') {
            stack[index].footnote.tags = [];
          }

          stack[index].footnote.tags.push(tagName);
          stackStorage.set(JSON.stringify(stack));

          // change the tag to emoji
          if (tagName.match(/pinned|📌/i)) {
            tagName = tagName.replace(/pinned/i, '📌');
            $(stackWrapper).addClass('pinned');
          }

          let tagsHTML = generateTagsHTML(tagName);

          // insert before tag input
          // TODO: rename divWrap class
          let divWrap = $(stackWrapper).find('.divWrap');
          divWrap.get(0).insertAdjacentHTML("beforebegin", tagsHTML);

          // reset value
          ev.target.value = '';

          // toggle divWrap visibility
          if ($(stackWrapper).hasClass('clip')) {
            // TODO: consider the use of jQuery toggle
            if ($(stackWrapper).find('.tag').length >= 4) {
              divWrap.addClass('hidden');
            } else {
              divWrap.removeClass('hidden');
            }
          } else {
            if ($(stackWrapper).find('.tag').length >= 5) {
              divWrap.addClass('hidden');
            } else {
              divWrap.removeClass('hidden');
            }
          }
        }
      } else if (ev.keyCode === 8 && tagName === '') {
        // TODO: refactor BACKSPACE event of tag input
        // BACKSPACE
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


          // for search optimization
          if (shadowNodes[0]) {
            // remove the item from duplicated textstack as well
            $(shadowNodes[0]).find('.stackwrapper').each((index, item) => {
              if ($(item).attr('id') === $(prevStackWrapper).attr('id')) {
                $(item).find('.tag').each((index, tag) => {
                  if ($(tag).text() === prevTagName) {
                    $(tag).remove();
                    return false;
                  }
                })
              }
            })
          }


          // remove the tag from tagStack if there is no item with the tag
          tagStack.splice(tagStack.findIndex(t => t === prevTagName), 1);
          $('.tag').each((index, item) => {
            let tagRegex = new RegExp(`${escapeRegExp(prevTagName)}$`, 'i');

            if ($(item).text().match(tagRegex)) {
              tagStack.push(prevTagName);
              return false;
            }
          })

          // remove pinned styles
          if (prevTagName.match(/pinned|📌/i)) {
            $(stackWrapper).removeClass('pinned');
            prevTag.removeClass('pinned');
          }
          // if (prevTagName.slice(1).match(/(fav|favourite|favorite)/i)) {
          if (prevTagName.match(/(★|☆|✭|⭐)/i)) {
            prevTag.removeClass('fav');
            // $(stackWrapper).removeClass('fav');
          }

          if (prevTagName.match(/(♡|💛|♥|❤)/i)) {
            prevTag.removeClass('like');
            // $(stackWrapper).removeClass('fav');
          }

          if (prevTagName.match(/(♡|💛|♥|❤)/i)) {
            prevTag.removeClass('like');
            // $(stackWrapper).removeClass('fav');
          }

          if (!isNaN(new Date(prevTagName))) {
            prevTag.removeClass('tagDate');
          }

          if (prevTagName.match(/\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu
          )) {
            prevTag.removeClass('emoji');
          }


          // set value
          $(tagInput).val(prevTagName);
          $(tagInput).trigger('focus');
        }
      }
    })
}

/**
 * 
 */
const attachNoteContentEvents = (wrapper) => {
  let contentDIV = wrapper.querySelector('.content');
  let prevHTML = wrapper.innerHTML;

  $(wrapper).find('.edit').click(
    () => {
      setTimeout(() => {
        toggleEditorMode(contentDIV, true);
      }, 100);
    }
  )

  // add to wrapper
  wrapper.addEventListener('dblclick', (e) => {
    if (wrapper.classList.contains('note')) {
      // fire only when the area out of text body double clicked
      if (!e.target.classList.contains('content')) {
        // workaround for bubble control
        setTimeout(hideBubble, 30);
        setTimeout(() => {
          toggleEditorMode(contentDIV, true)
        }, 100)
      }
    }
  });

  contentDIV.addEventListener('focus', (e) => {
    // remove html tags

    Array.from(contentDIV.childNodes).forEach((item) => {
      $(item).contents().unwrap()
    }, '')

    // insert decimal code as a zero-width space for displaying caret
    if (!contentDIV.innerHTML.match(String.fromCharCode(8203))) {
      contentDIV.innerHTML += '&#8203;';
    }

    // move caret to the end of the text
    const node = contentDIV.childNodes[contentDIV.childNodes.length - 1]
    const editorRange = document.createRange()
    const editorSel = window.getSelection()
    editorRange.setStart(node, node.length)
    editorRange.collapse(true)
    editorSel.removeAllRanges()
    editorSel.addRange(editorRange)
  })

  wrapper.addEventListener('mouseleave', (e) => {
    if ($(contentDIV).attr('contentEditable') === 'true') {
      toggleEditorMode(contentDIV, false);
    }
    return false;
  });

  contentDIV.addEventListener('focusout', (e) => {
    $('#toolbox').show();
    $('#statusboard').text('');
    // TODO: rename entering class
    $('#statusboard').removeClass('entering');
  });

  // detect changes on content editable
  wrapper.addEventListener('blur', fireChange);
  wrapper.addEventListener('keyup', fireChange);
  wrapper.addEventListener('paste', fireChange);
  wrapper.addEventListener('copy', fireChange);
  wrapper.addEventListener('cut', fireChange);
  // wrapper.addEventListener('mouseup', fireChange);

  // fire div change event used for content change event
  wrapper.addEventListener('change', (e) => {
    let newHTML = contentDIV.innerHTML.replace(/<br>$/, '');
    updateStatusBoard(newHTML);

    // find note item index
    const id = $(e.target).attr('id');
    const index = stack.findIndex(item => item.id === id);

    newHTML = $(contentDIV).unhighlight({ element: 'span', className: 'highlighted' }).html();

    // update note item
    stack[index].content = newHTML.replace(/<br>/ig, '\n');
    stackStorage.set(JSON.stringify(stack));

    // for search optimization
    /////
    if (shadowNodes[0]) {
      $(shadowNodes[0]).find('.stackwrapper').each((index, item) => {
        if ($(item).attr('id') === id) {
          item.innerHTML = wrapper.innerHTML;

          $(item).unhighlight({ element: 'span', className: 'highlighted' });

          return false;
        }
      })
    }

  })

  // fire change event of content editable div when its content changed 
  function fireChange(e) {
    const newHTML = wrapper.innerHTML;

    // replace with new HTML
    if (prevHTML !== newHTML) {
      wrapper.dispatchEvent(new Event('change'));
      prevHTML = newHTML;
    }

    // insert zero-width space when the text is empty
    if (contentDIV.innerHTML.length == 0) {
      contentDIV.innerHTML += '&#8203;';
    }
  }
}


/**
 * Initialize events listners
 */
const initializeEventListeners = () => {
  /**
   * window events
   */
  window.onscroll = (e) => {
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

  // for search optimization
  window.onload = () => {
    shadowNodes.push(document.querySelector('#textstack').cloneNode(true));
  }

  // save window state when the popup window is closed
  $(window).on('unload blur', () => {
    windowState.closedDateTime = new Date().toISOString();
    background.chrome.storage.local.set(windowState);
  })

  window.addEventListener('keyup', (e) => {
    if (e.keyCode === Keys.F5) {
      renderStack();
    } else if (e.ctrlKey && e.keyCode === Keys.FORWARD_SLASH) {
      createSeparator();
    } else if (e.ctrlKey && e.keyCode === Keys.ENTER) {
      // when another tag is on focus
      if ($('.tagadd, .separatorInput').is(':focus')) {
        return false;
      }  
      // create a note / focus on the note
      const noteInEdit = $('[contenteditable=true]').get(0)
      if (noteInEdit) {
        toggleEditorMode(noteInEdit, false);
        return false;
      } else {
        createNoteItem();
        const newNote = windowState.sortedByNew ? $('.content').first() : $('.content').last()
        toggleEditorMode(newNote, true);
        updateStatusBoard(newNote.html());
        return false;
      }
    }
  })

  /**
   * header events
   */
  /* dropdown list */
  $('#tagsearch-result, header').on('mouseleave', hideDropdownList);

  /* searchbox  */
  $('.searchbox').on({
    click: hideDropdownList,
    dblclick: showDropdownList,
    keydown: selectOnDropdownList,
    input: () => {
      let query = $('.searchbox').val();

      if (query[0] === '#' && query.length > 1) {
        $(function () {
          sortable = Sortable.create(document.querySelector('#textstack'), {
            sort: true,
            delay: 150,
            animation: 150,
            dataIdAttr: 'id',
            filter: '.date',
            group: query.substring(1),
            store: {
              get: function (sortable) {
                var order = localStorage.getItem(sortable.options.group.name);
                return order ? order.split('|') : [];
              },
              set: function (sortable) {
                var order = sortable.toArray();
                localStorage.setItem(sortable.options.group.name, order.join('|'));
              }
            }
          });
        });


      }

      // wait a while for user input

      // TODO: compare the speed with normal
      if (shadowNodes.length === 0) {
        shadowNodes.push(document.querySelector('#textstack').cloneNode(true));
      }

      let milseconds = 0;
      let queryLength = $('.searchbox').val().length;
      switch (queryLength) {
        case 0:
          milseconds = 1;
          break;
        case 1:
          milseconds = 500;
          break;
        case 2:
          milseconds = 400;
          break;
        case 3:
          milseconds = 300;
          break;
        case 4:
          milseconds = 100;
          break;
        default:
          milseconds = 50;
      }

      // optimization for reset search
      if (queryLength === 0 && !$('#textstack').hasClass('viewmode')) {
        // reset task
        doTaskOnceInputIsDone.TID = {};

        // remove current DOM
        $('#textstack').remove();

        // attach duplicated DOM
        document.querySelector('#main').insertAdjacentElement('beforeend', shadowNodes[0]);
        $(function () {
          sortable = Sortable.create(document.querySelector('#textstack'), {
            sort: true,
            delay: 150,
            animation: 150,
            dataIdAttr: 'id',
            filter: '.date',
            group: query.substring(1),
            store: {
              get: function (sortable) {
                var order = localStorage.getItem(sortable.options.group.name);
                return order ? order.split('|') : [];
              },
              set: function (sortable) {
                var order = sortable.toArray();
                localStorage.setItem(sortable.options.group.name, order.join('|'));
              }
            }
          });
        });


        stackDOM = document.querySelector('#textstack');

        // atach eventes
        attachEventsToTextStack();
        $('.stackwrapper').each((index, item) => {
          attachTagInputEvents(item);
          attachNoteContentEvents(item);
        });


        $('.separator').each((index, item) => {
          item.classList.add('filtered');
          attachSeparatorEvents(item);
        })


        // reset and clone the current DOM
        shadowNodes.length = 0;
        shadowNodes.push(document.querySelector('#textstack').cloneNode(true))


        // show toolbox
        $('.opener').hide();
        $('#statusboard').text('');
        $('#toolbox').show();
        $('.search-cancel-button').hide();
        $('footer').show();
        hideDropdownList();

        windowState.searchQuery = '';
      } else {
        // chrome.storage.local.get(['sortableTest'], state => {
        //   sortable = state.order;
        //   sortableForClone = state.order;
        // })
        // sortable.option("disabled", false);
        doTaskOnceInputIsDone(updateSearchResult, milseconds)
      }
    }
  }
  )
  
  /* search cancel button */
  $('.search-cancel-button').click((e) => {
    fireNoteSearch('');
    $('.searchbox').trigger('focus');
  });

  /* toolbox & text area */
  $('.create').click(() => {
    createNoteItem();
    const newNote = windowState.sortedByNew ? $('.content').first() : $('.content').last()
    toggleEditorMode(newNote, true);
    updateStatusBoard(newNote.html());
  });

    /* view mode */
  $('.view').click(() => {
    if ($('#textstack').hasClass('viewmode')) {
      $('#textstack').removeClass('viewmode');
      $('#toolbox').removeClass('viewmode');
      // $('.view').text('assignment');
      fireNoteSearch('');
    } else {
      fireNoteSearch('');
      // $('.view').text('assignment');
      $('#textstack').addClass('viewmode');
      $('#toolbox').addClass('viewmode');
    }
  });

  /* file export */
  $('.export').click(exportNoteItemsAsTextFile);
  // $('.export').click(() => { toggleFileExportModal(true) });

  $('#statusboard').click(() => {
    $('#toolbox').show();
    $('#statusboard').text('');
  })

  $('#sort').click(() => { switchSortOrder(!windowState.sortedByNew) });

  $('.opener').hide();

  $('.opener').on({
    click:()=>{
      createSeparator();
    }    

  }  )


  attachEventsToTextStack();


  /**
   * footer
   */ 
  $('#clearstack').click(() => { toggleClearStackModal(true) });
  $('#clearstack-window .overlay').click(() => { toggleClearStackModal(false) });
  $('#clearstack-window .ok').click(() => {
    clearAllItems();
    toggleClearStackModal(false)
  });
  $('#clearstack-window .cancel').click(() => { toggleClearStackModal(false) });


  /**
   * modal windows
   */ 
  $('#fileexport-window .overlay').click(() => { toggleFileExportModal(false) });
  $('#fileexport-window .ok').click((e) => {
    if ($(':checked').val() === 'text') {
      exportNoteItemsAsTextFile();
    } else if ($(':checked').val() === 'json') {
      exportJsonFile();
    }
    toggleFileExportModal(false)
  });
  $('#fileexport-window .cancel').click(() => { toggleFileExportModal(false) });

}

const attachEventsToTextStack = () => {
  /**
 * the text stack dynamically changes
 */
  $('#textstack').click((e) => {
    let targetElem = e.target;
    let stackWrapper = $(e.target).parent().parent();

    // TAG
    if ($(targetElem).hasClass('tag')) {
      if (e.ctrlKey && $(targetElem).hasClass('removing')) {
        let tagName = $(targetElem).text();
        let stackWrapper = $(targetElem).parent().parent();

        // remove pinned styles
        if (tagName.match(/pinned|📌/i)) {
          $(stackWrapper).removeClass('pinned');
        }

        if (stackWrapper.find('.tag').length > 1 && $(targetElem).prev().length != 0) {
          // remove tag from footnote
          let id = stackWrapper.find('input').val();
          let index = stack.findIndex(item => item.id === id);
          let tagIndex = stack[index].footnote.tags.indexOf(tagName);
          // remove the tag
          stack[index].footnote.tags.splice(tagIndex, 1);
          stackStorage.set(JSON.stringify(stack));

          // remove item in the UI
          $(targetElem).remove();

          // for search optimization
          if (shadowNodes[0]) {
            // remove the item from duplicated textstack as well
            $(shadowNodes[0]).find('.stackwrapper').each((index, item) => {
              if ($(item).attr('id') === id) {
                $(item).find('.tag').each((index, tag) => {
                  if ($(tag).text() === tagName) {
                    $(tag).remove();
                    return false;
                  }
                })
              }
            })
          }

          // remove the tag from tagstack if there's no item with the tag
          tagStack.splice(tagStack.findIndex(t => t === tagName), 1);

          $('.tag').each((index, item) => {
            let tagRegex = new RegExp(`${escapeRegExp(tagName)}`, 'i');
            console.log($(item).text());

            if ($(item).text().match(tagRegex)) {
              tagStack.push(tagName);
              return false;
            }
          })
          stackWrapper.find('.footnote')
            .find('.divWrap').removeClass('hidden');

        }
      } else {
        // when hashtag clicked
        if (!isNaN(Date.parse($(targetElem).html()))) {
          filterNoteItemsWithDateTag('::d');
          $('.searchbox').val('::d');

          $('#statusboard').removeClass('entering');
        } else {
          fireNoteSearch('#' + $(targetElem).html());
        }


        $('#statusboard').removeClass('entering');


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
      let textItem = $(targetElem).parent().parent().get(0);
      removeNoteItem(textItem);
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
  });

  $('#textstack').on({
    mouseover: (e) => {
      if ($(e.target).hasClass('tag')) {
        let stackWrapper = $(e.target).parent().parent();
        if ($(stackWrapper).find('.tag').length > 1
          && !$(e.target).hasClass('type')) {
          if (e.ctrlKey && !$(e.target).hasClass('removing')) {
            $(e.target).addClass('removing');
          }
        }
      }
    },
    mouseout: (e) => {
      if ($(e.target).hasClass('tag')) {
        if (!['note', 'clip', 'bookmark'].includes(e.target.textContent)) {
          $(e.target).removeClass('removing');
        }
      }
    },
  })

}

/* search */
const fireNoteSearch = (query) => {
  $('.searchbox').val(query);
  $('.searchbox').trigger('input')
};

// ========== DISPLAY ==========
/**
 * 
 */
const showDropdownList = () => {
  setDropdownListItems();
  filterDropdownListItems($('.searchbox').val());
  $('#tagsearch-result').animate({ scrollTop: 0 }, 20);

  // show and select the first item
  $('#tagsearch-result').show();
  $('li').first().addClass('selected');
}

/**
 * 
 */
const hideDropdownList = () => {
  $('#tagsearch-result').hide();
  $('li.selected').removeClass('selected');
}

/* clear stack window modal*/
/**
 * 
 */
const toggleClearStackModal = (
  display = $('#clearstack-window.modal').hasClass('hidden') ? true : false
) => {
  if (display) {
    $('#clearstack-window.modal').removeClass('hidden');
  } else {
    $('#clearstack-window.modal').addClass('hidden');
  }
}

const toggleFileExportModal = (
  display = $('#fileexport-window.modal').hasClass('hidden') ? true : false
) => {
  if (display) {
    $('#fileexport-window.modal').removeClass('hidden');
  } else {
    $('#fileexport-window.modal').addClass('hidden');
  }
}

/**
 * 
 */
const toggleEditorMode = (
  div,
  display = !$(div).attr('contentEditable') ? true : false
) => {
  if (display) {
    $(div).attr('contentEditable', true);
    $(div).focus();

    // change visual styles
    $(div).parent().addClass('editing');
    $(div).next().hide(); // edit icon
  } else {
    $(div).attr('contentEditable', false);

    // replace new lines with br tag
    div.innerHTML = enableURLEmbededInText(div.innerText);
    div.innerHTML = div.innerHTML.replace(/\n+$/i, '');
    div.innerHTML = div.innerHTML.replace(/\n/gi, '<br>');
    div.innerHTML = div.innerHTML.replace(String.fromCharCode(8203), '');

    // change visual styles
    $(div).parent().removeClass('editing');
    $(div).next().show(); // edit icon
  }
}

/**
 * 
 */
const displayMessage = (message) => {
  if ($('#statusboard').hasClass('entering')) {
    $('#statusboard').removeClass('entering');
  }
  $('#statusboard').text(message);
  $('#toolbox').hide();
}

/**
 * 
 */
const updateStatusBoard = (text) => {
  $('#toolbox').hide();

  let info = extractTextInfo(text.replace(String.fromCharCode(8203), ''));
  $('#statusboard').html(
    `${info.wordCount} words<span class="inlineblock">${info.charCount} chars</span>`
  );

  if (!$('#statusboard').hasClass('entering')) {
    $('#statusboard').addClass('entering');
  }
}

/**
 * 
 */
const sortNotes = (sortingByNew) => {
  // NEW
  if (sortingByNew) {
    $('#sort').html('New <i class="material-icons">arrow_upward</i>');
    // $('#textstack').css('flexDirection', 'column-reverse')
    // OLD
  } else {
    $('#sort').html('Old <i class="material-icons">arrow_downward</i>');
    $('#textstack').css('flexDirection', 'column')
    // let textStack = $('#textstack'); // your parent ul element
    // textStack.children().each(function (i, wrapper) { textStack.prepend(wrapper) })
  }
  let textStack = $('#textstack'); // your parent ul element
  textStack.children().each(function (i, wrapper) { textStack.prepend(wrapper) })

  windowState.sortedByNew = sortingByNew;
}

const switchSortOrder = (sortingByNew) => {

  // NEW
  if (sortingByNew) {
    $('#sort').html('New <i class="material-icons">arrow_upward</i>');
    // OLD
  } else {
    $('#sort').html('Old <i class="material-icons">arrow_downward</i>');
  }

  sortable.sort(sortable.toArray().reverse())
  sortable.save();


  windowState.sortedByNew = sortingByNew;

}

// ========== EXPORT ==========
/**
 * export the note items visible in the stack
 */
const exportNoteItemsAsTextFile = () => {
  const ids = [];

  // get note item ids displayed
  $('#textstack').find('.stackwrapper').each((index, wrapper) => {
    if (!$(wrapper).is(":hidden")) {
      ids.push($(wrapper).attr('id'));
    }
  })


  // create exporting content
  const content = stack.slice(0)
    .filter(item => ids.includes(item.id))
    .sort((a, b) => {
      a = new Date(a.date);
      b = new Date(b.date);
      if (!windowState.sortedByNew) {
        // NEW => OLD
        return a > b ? -1 : a < b ? 1 : 0;
      } else {
        // OLD => NEW
        return a > b ? 1 : a < b ? -1 : 0;
      }
    })
    .reduce((content, item) => {
      let header = '-----\n';
      header += 'created: ' + `'${item.date}'\n`
      header += 'type: ' + `${item.type}\n`
      header += 'tags: ' + `[${item.footnote.tags.join(',')}]\n`
      header += '-----\n\n'

      // remove html tags
      const sanitizedContent = $('<div>', {
        html: item.content
      }).text();

      content += header + sanitizedContent + "\n";

      // 
      if (item.type === 'clip') {
        content += '\n';
        content += `${item.footnote.pageTitle}\n`
        content += `${item.footnote.pageURL}\n`
      }

      return content += '\n';
    }, '')

  // create blob
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const blob = new Blob([bom, content], {
    type: 'data:text/plain'
  });

  // create url to download
  window.URL = window.URL || window.webkitURL;
  const url = window.URL.createObjectURL(blob);

  // download the file
  chrome.downloads.download({
    url: url,
    filename: formatDate() + '.txt',
    saveAs: true
  });
}

const exportJsonFile = () => {
  const ids = [];

  // get note item ids displayed
  $('#textstack').find('.stackwrapper').each((index, wrapper) => {
    if (!$(wrapper).is(":hidden")) {
      ids.push($(wrapper).attr('id'));
    }
  })

  // create exporting content
  const content = stack.slice(0)
    .filter(item => ids.includes(item.id))
    .sort((a, b) => {
      a = new Date(a.date);
      b = new Date(b.date);
      if (windowState.sortedByNew) {
        // NEW => OLD
        return a > b ? -1 : a < b ? 1 : 0;
      } else {
        // OLD => NEW
        return a > b ? 1 : a < b ? -1 : 0;
      }
    });

  // create blob
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const blob = new Blob([bom, JSON.stringify(content)], {
    type: 'data:text/plain'
  });

  // create url to download
  window.URL = window.URL || window.webkitURL;
  const url = window.URL.createObjectURL(blob);

  // download the file
  chrome.downloads.download({
    url: url,
    filename: formatDate() + '.json',
    saveAs: true
  });
}

// ========== STORAGE ==========
/**
 * 
 */
const createNoteItem = () => {
  const note = {
    id: uuidv4(),
    type: 'note',
    content: '',
    footnote: {
      tags: [],
      pageTitle: '',
      pageURL: ''
    },
    // date: formatDate()
    date: new Date().toISOString()
  }

  // add the current tag in the seachbox
  const searchQuery = windowState.searchQuery;
  if (searchQuery[0] === '#' && searchQuery.length > 0) {
    note.footnote.tags.push(searchQuery.substring(1))
  }

  // add item to stack
  stack.push(note);
  stackStorage.set(JSON.stringify(stack));

  let wrapper = $(generateNoteItemHTML(note)).get(0);
  attachTagInputEvents(wrapper);
  attachNoteContentEvents(wrapper);

  // render
  if (windowState.sortedByNew) {
    $('#textstack').prepend(wrapper);
  } else {
    $('#textstack').append(wrapper);
  }

  sortable.save();

  // for search optimization
  if (shadowNodes[0]) {
    // remove the item from duplicated textstack as well
    let wrapper = $(generateNoteItemHTML(note)).get(0);
    attachTagInputEvents(wrapper);
    attachNoteContentEvents(wrapper);
    // $(dupNodes[0]).append(wrapper);
    if (windowState.sortedByNew) {
      $(shadowNodes[0]).prepend(wrapper);
    } else {
      $(shadowNodes[0]).append(wrapper);
    }

  }
};


/**
 * 
 */
const removeNoteItem = (noteItem) => {
  // apply visual effects and display message
  noteItem.classList.add('removed')
  displayMessage("Item Removed!");

  // remove from stack and storage after a while
  setTimeout(() => {
    // remove the item
    const id = noteItem.querySelector('input').value;
    stack = stack.filter(item => item.id !== id);
    stackStorage.set(JSON.stringify(stack));
    noteItem.remove();

    if (typeof sortable !== 'undefined') {
      sortable.save()
    }
    // show toolbox
    $('#toolbox').show();
    $('#statusboard').text('');

    // for search optimization
    if (shadowNodes[0]) {
      // remove the item from duplicated textstack as well
      $(shadowNodes[0]).find('.stackwrapper').each((index, item) => {
        if ($(item).attr('id') === id) {
          $(item).remove();
          return false;
        }
      })
    }
  }, 450);
}

/**
 * 
 */
const clearAllItems = () => {
  // clear storage
  stackStorage.reset();

  // reset the form
  $('.searchbox').val('');
  $('#textstack').empty();

  // reset state variables
  stack = [];
  dateStack = [];
  tagStack = ['bookmark', 'clip', 'note'];
  windowState = {
    searchQuery: '',
    scrollY: 0,
    sortedByNew: true
  }
}

/**
 * 
 */
const replaceTagName = (prevTag, newTag) => {
  // add item to stack
  stack.forEach(item => {
    if (item.footnote.tags.includes(prevTag)) {
      item.footnote.tags.splice(item.footnote.tags.findIndex(tag => tag == prevTag), 1, newTag)
    }
  })
  stackStorage.set(JSON.stringify(stack));

}

/**
 * render textitems on text stack
 */
const renderStack = () => {
  // remove all text items
  $('#textstack').empty();

  // read from storage
  stackStorage.get(rawData => {
    if (typeof rawData === 'undefined') {
      stackStorage.reset();
    } else {
      stack = JSON.parse(rawData);


      stack
        .sort((a, b) => {
          a = new Date(a.date);
          b = new Date(b.date);
          // OLD => NEW
          return a > b ? 1 : a < b ? -1 : 0;
        })



      // NORMAL MODE
      let notesHTML = "";
      stack
        // .filter(res => { res.type !== 'separator' })
        .forEach(res => {
          if (res.type === 'separator') {
            notesHTML = generateSeparatorHTML(res) + notesHTML;
          } else {
            notesHTML = generateNoteItemHTML(res) + notesHTML;
          }
        });


      // insert HTML
      document.querySelector('#textstack').insertAdjacentHTML('afterbegin', notesHTML)

      // insert separators between items
      insertDateSeparator();

      $('.separator').each((index, item) => {
        console.log(item);
        attachSeparatorEvents(item);
      })

      $('.stackwrapper').each((index, item) => {
        // console.log(item);
        attachTagInputEvents(item);
        if ($(item).hasClass('note')) {
          attachNoteContentEvents(item);
        }
      })
    }
  });

};

/**
 * insert date as a separator
 */
const insertDateSeparator = () => {
  $('#textstack').children().each((index, wrapper) => {
    let date = new Date($(wrapper).find('.itemDate').val());
    let id = $(wrapper).attr('id')

    if (index === 0) {
      $(wrapper).get(0).insertAdjacentHTML('afterend', `<div class="date">${formatDate(date)}</div>`);
      dateStack.push({ id: id, date: date });
    } else {
      if (!isNaN(new Date(date))) {
        if (formatDate(new Date(dateStack[dateStack.length - 1].date)) !== formatDate(new Date(date))) {
          $(wrapper).get(0).insertAdjacentHTML('afterend', `<div class="date">${formatDate(date)}</div>`);
          dateStack.push({ id: id, date: date });
        }
      }
    }
  });

  // insert current time
  let now = new Date();
  let hours = ('0' + now.getHours()).slice(-2);
  let minutes = ('0' + now.getMinutes()).slice(-2);

  let currentDate = `<div class="date current">${formatDate() + ' ' + hours + ":" + minutes}</div>`

  $('#textstack').first().get(0).insertAdjacentHTML('afterbegin', currentDate)

}

/**
 * Function to restore the previous window state
 */
const restorePreviousState = () => {
  chrome.storage.local.get(['searchQuery', 'scrollY', 'closedDateTime', 'sortedByNew'],
    state => {
      windowState = state;

      const timeElapsed = typeof state.closedDateTime !== 'undefined'
        ? (new Date() - new Date(state.closedDateTime)) : config.CACHE_DURATION;

      if (timeElapsed < config.CACHE_DURATION) {
        // restore searchbox
        if (typeof state.searchQuery !== 'undefined') {
          fireNoteSearch(state.searchQuery);
        }
        // restore sort order
        if (typeof state.sortedByNew === 'undefined') {
          windowState.sortedByNew = true;
        } else {
          windowState.sortedByNew = state.sortedByNew;
          if (windowState.sortedByNew) {
            $('#sort').html('New <i class="material-icons">arrow_upward</i>');

            // OLD
          } else {
            $('#sort').html('Old <i class="material-icons">arrow_downward</i>');
            // sortable.sort(sortable.toArray().reverse())
            // sortable.save();
          }

        }

        // restore scrollY
        if (typeof state.scrollY !== 'undefined') {
          window.scrollTo(0, state.scrollY);
        }
      }
    })
}

// utilities
const convertDateToDateTimeFormat = () => {
  const convertedData = [];

  stackStorage.get(rawData => {
    if (typeof rawData === 'undefined') {
      stackStorage.reset();
    } else {
      stack = JSON.parse(rawData);
      stack.forEach(res => {
        res.date = new Date(res.date).toISOString();
        convertedata.push(res);
      });
    }
  });
  stackStorage.set(JSON.stringify(convertedData));
}

const importFromJsonFile = async (path) => {
  const url = chrome.runtime.getURL(path);
  $.getJSON(url, function (data) {
    console.log("done");
    stackStorage.set(JSON.stringify(data.raw));
  });
}

let sortable;
// let sortableForClone;
// ========== INITIALIZATION ==========
// initialize
document.addEventListener('DOMContentLoaded', () => {

  // importFromJsonFile("/importData.json").then(() => {
  //   // convertDateToDateTimeFormat();
  //   initializeEventListeners();
  //   renderStack();
  //   restorePreviousState();
  // })

  // make textstack draggable
  $(function () {
    sortable = Sortable.create(document.querySelector('#textstack'), {
      delay: 150,
      animation: 150,
      dataIdAttr: 'id',
      sort: false,
      disable: true,
    });
  });


  initializeEventListeners();
  renderStack();

  restorePreviousState();


});


const generateSeparatorHTML = ({ id, type, content, footnote, date }) => {
  // add the most outer opening tag
  let separatorHTML = `<div class="${type}" id="${id}">`

  // add content body
  separatorHTML += `<input class="separatorInput disabled" placeholder="新規セパレータを作成" spellcheck="false" type="text" style="text-align:left;" value="${enableURLEmbededInText(content)}">`;
  separatorHTML += `<div class="footnote hidden">`;

  // add tags to footnote
  if (typeof footnote.tags !== 'undefined') {
    footnote.tags.forEach(tagName => {
      separatorHTML += `<span class="tag">${tagName}</span>`
    })
  }

  separatorHTML += "</div>"

  // add the most outer closing tag
  separatorHTML += "</div>"

  return separatorHTML;
}



const createSeparator = () => {
  let query = $('.searchbox').val();

  if (query[0] === '#' && query.substring(1) !== '') {

    const separator = {
      id: uuidv4(),
      type: 'separator',
      content: '',
      footnote: {
        tags: [query],
        pageTitle: '',
        pageURL: ''
      },
      // date: formatDate()
      date: new Date().toISOString()
    }
    // add item to stack
    stack.push(separator);
    stackStorage.set(JSON.stringify(stack));

    let wrapper = $(generateSeparatorHTML(separator)).get(0);
    attachSeparatorEvents(wrapper)

    // render
    if (windowState.sortedByNew) {
      $('#textstack').prepend(wrapper);
    } else {
      $('#textstack').append(wrapper);
    }

    sortable.save();

    $(wrapper).find('input').focus();
  }



};

const attachSeparatorEvents = (stackwrapper) => {

  $(stackwrapper).find('.separatorInput').on({

    mouseover: (e) => {
      if (e.ctrlKey && !$(e.target).hasClass('removing')) {
        $(e.target).addClass('removing');
      }
    },
    mouseout: (e) => {
      $(e.target).removeClass('removing');
    },

  });



  $(stackwrapper).find('.separatorInput').blur(
    (ev) => {
      ev.preventDefault();

      let separatorName = ev.target.value;

      if (!separatorName.match(/^\s+$/)) {

        separatorName = ev.target.value.trim();

        // update tag information
        const index = stack.findIndex(item => item.id === $(stackwrapper).attr('id'));

        if (typeof stack[index].content === 'undefined') {
          stack[index].content = '';
        }

        stack[index].content = separatorName;
        stackStorage.set(JSON.stringify(stack));
      } else {

        ev.target.value = ev.target.defaultValue;
      }

      ev.target.classList.add('disabled');
    }
  )
  $(stackwrapper).find('.separatorInput').on('click', (ev)=>{
    ev.target.classList.remove('disabled');

  });


  $(stackwrapper).find('.separatorInput').on('click',
    (ev) => {
      let targetElem = ev.target;
      if (ev.ctrlKey && $(targetElem).hasClass('removing')) {
        // remove tag from footnote
        let id = $(targetElem).parent().attr('id');
        stack = stack.filter(item => item.id !== id);
        stackStorage.set(JSON.stringify(stack));
        // remove item in the UI
        $(targetElem).parent().remove();
      } else {

        $(ev.target).focus();

      }

    }
  )

  $(stackwrapper).find('.separatorInput').on('focus', (ev) => {
    ev.target.classList.remove('disabled');
  });

  // KEYUP
  $(stackwrapper).find('.separatorInput').keyup(
    (ev) => {
      ev.preventDefault();

      let separatorName = ev.target.value;

      if (ev.keyCode === 13) {

        separatorName = ev.target.value.trim();

        if (separatorName !== '') {

          // update tag information
          const index = stack.findIndex(item => item.id === $(stackwrapper).attr('id'));

          if (typeof stack[index].content === 'undefined') {
            stack[index].content = '';
          }

          stack[index].content = separatorName;
          stackStorage.set(JSON.stringify(stack));
        }
      }
    })



}

