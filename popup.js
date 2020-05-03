// seachbox
const dropdownList = document.querySelector('#tagsearch-result');
let stackDOM = document.querySelector('#textstack');

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
  } else if (query === '::d') {
    hits = filterNoteItemsWithDateTag(query);
  } else {
    hits = filterNoteItems(query);
  }
  filterDropdownListItems(query);

  // change styles on search
  if (query) {
    // set text
    $('#statusboard').text(hits === 0 ? 'No Results' : `${hits} of ${stack.length}`)
    // show/hide
    $('#toolbox').hide();
    $('.search-cancel-button').show();
    $('footer').hide();
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

  Array.from(stackDOM.children)
    .map(textItem => {
      if ($(textItem).hasClass('date')) {
        textItem.classList.add('filtered');
      } else {
        $(textItem).find('.tag').each((index, tag) => {

          if ($(tag).text().match(tagRegex)) {
            textItem.classList.remove('filtered');
            hits++;
            return false;
          } else {
            textItem.classList.add('filtered');
          }
        })

      }
      return textItem;
    })
  return hits;
}




const filterNoteItemsWithDateTag = (dateTag) => {
  // dateTag = dateTag.substring(2);

  let hits = 0;

  Array.from(stackDOM.children)
    .map(textItem => {
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
      return textItem;
    })
  return hits;
}



/**
 * 
 */
const filterNoteItems = (term) => {
  let termRegex;
  let hits = 0;


  // Search in Japanese/English
  if (containsJapanese(term)) {
    termRegex = new RegExp(`(${escapeRegExp(term)})(.*?)`, 'ig');
  } else {
    termRegex = new RegExp(`(?!<span .+? target="_blank"/>)(${escapeRegExp(term)})(.*?)(?!</span>)`, 'ig');
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

        // $(contentDIV).highlight(term, { element: 'span', className: 'highlighted' });

      } else {
        // get the text back to the initial state
        contentDIV.innerHTML = enableURLEmbededInText(contentDIV.innerText);
        contentDIV.innerHTML = contentDIV.innerHTML.replace(/\n/gi, '<br>');
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
    // ENTER
    if (liSelected) {
      liSelected.removeClass('selected');
      fireNoteSearch('#' + liSelected.text().replace(/edit$/, ''));
    }
    hideDropdownList()
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
      showDropdownList()
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

  // 
  // tagStack = tagStack.slice(0, 3).concat(tagStack.slice(3).sort());
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
                tagStack.splice(tagStack.findIndex(t => t === oldTag), 1, newTag);
                e.target.defaultValue = newTag;

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
    tagsHTML += `<span class="tag pinned emoji">${tagName}</span>`
  } else if (tagName.match(/(★|☆|✭|⭐)/i)) {
    // favourite
    tagsHTML += `<span class="tag fav">${tagName}</span>`
  } else if (tagName.match(/(♡|💛|♥|❤)/i)) {
    // likes
    tagsHTML += `<span class="tag like">${tagName}</span>`
  } else if (
    tagName.match(/\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu
    )) {
    // emoji
    tagsHTML += `<span class="tag emoji">${tagName}</span>`
  } else if (!isNaN(new Date(tagName))) {
    // datetag
    // TODO: rename tagDate class
    tagsHTML += `<span class="tag tagDate">${tagName}</span>`
  } else {
    tagsHTML += `<span class="tag">${tagName}</span>`
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

  // ctrl + Enter to end editing
  contentDIV.addEventListener('keydown', (e) => {
    if (e.keyCode === 13 && e.ctrlKey) {
      // Ctrl + Enter
      toggleEditorMode(contentDIV, false);
      return false;
    }
  });

  wrapper.addEventListener('mouseleave', (e) => {
    if ($(contentDIV).attr('contentEditable')) {
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
  wrapper.addEventListener('mouseup', fireChange);

  // fire div change event used for content change event
  wrapper.addEventListener('change', (e) => {
    const newHTML = contentDIV.innerHTML.replace(/<br>$/, '');
    updateStatusBoard(newHTML);

    // find note item index
    const id = $(e.target).attr('id');
    const index = stack.findIndex(item => item.id === id);

    // update note item
    stack[index].content = newHTML.replace(/<br>/ig, '\n');
    stackStorage.set(JSON.stringify(stack));
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
  /* window events */
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

  $(window).on('unload blur', () => {
    windowState.closedDateTime = new Date().toISOString();
    background.chrome.storage.local.set(windowState);
  })

  /* header */
  /* dropdown list */
  $('#tagsearch-result, header').on('mouseleave', hideDropdownList);

  $('#tagsearch-result').on('scroll', (e) => {
    const clientHeight = $('#tagsearch-result').innerHeight();
    const scrollHeight = $('#tagsearch-result').prop('scrollHeight')
    if (scrollHeight - (clientHeight + $('#tagsearch-result').scrollTop()) <= 0) {
      $('#tagsearch-result').addClass('dropdownlistBottom');
    } else {
      $('#tagsearch-result').removeClass('dropdownlistBottom');
    }
  });

  let dupNodes = [];
  /* searchbox  */
  $('.searchbox').on({
    click: hideDropdownList,
    dblclick: showDropdownList,
    keydown: selectOnDropdownList,
    input: () => {
      // wait a while for user input

      if (dupNodes.length === 0) {
        dupNodes.push(document.querySelector('#textstack').cloneNode(true));
      }

      let milseconds = 0;
      let queryLength = $('.searchbox').val().length;
      switch (queryLength) {
        case 0:
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

      if (queryLength === 0) {
        // reset task
        doTaskOnceInputIsDone.TID = {};
        $('#textstack').remove();
        document.querySelector('#main').insertAdjacentElement('beforeend', dupNodes[0]);
        stackDOM = document.querySelector('#textstack');
        attachEventsToTextStack();

        $('.stackwrapper').each((index, item) => {
          attachTagInputEvents(item);
          attachNoteContentEvents(item);
        });
        dupNodes.length = 0;
        dupNodes.push(document.querySelector('#textstack').cloneNode(true))

        $('#statusboard').text('');
        // show/hide
        $('#toolbox').show();
        $('.search-cancel-button').hide();
        $('footer').show();
        hideDropdownList();
      } else {
        doTaskOnceInputIsDone(updateSearchResult, milseconds)
      }

    }
  }
  )

  $('.search-cancel-button').click((e) => {
    fireNoteSearch('');
    $('.searchbox').trigger('focus');
  });

  /* toolbox & text area*/
  $('.create').click(() => {
    createNoteItem();
    toggleEditorMode($('.content').last(), true);

    updateStatusBoard($('.content').last().html());
  });

  $('.view').click(() => {
    if ($('#textstack').hasClass('viewmode')) {
      $('#textstack').removeClass('viewmode');
      $('#toolbox').removeClass('viewmode');
      $('.view').text('assignment');
    } else {
      $('#textstack').addClass('viewmode');
      $('#toolbox').addClass('viewmode');
      $('.searchbox').val('');
      $('.view').text('assignment');
    }
  });


  $('.export').click(exportTextItems);
  $('#statusboard').click(() => {
    $('#toolbox').show();
    $('#statusboard').text('');
  })
  $('#sort').click(() => { sortNotes(!windowState.sortedByNew) });


  attachEventsToTextStack();

  /* footer & modal */
  $('#clearstack').click(() => { toggleClearStackModal(true) });
  $('.overlay').click(() => { toggleClearStackModal(false) });
  $('.ok').click(() => {
    clearAllItems();
    toggleClearStackModal(false)
  });
  $('.cancel').click(() => { toggleClearStackModal(false) });
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
  display = $('.modal').hasClass('hidden') ? true : false
) => {
  if (display) {
    $('.modal').removeClass('hidden');
  } else {
    $('.modal').addClass('hidden');
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
    $('#textstack').css('flexDirection', 'column-reverse')
    // OLD
  } else {
    $('#sort').html('Old <i class="material-icons">arrow_downward</i>');
    $('#textstack').css('flexDirection', 'column')
  }
  windowState.sortedByNew = sortingByNew;
}

// ========== EXPORT ==========
const exportTextItems = () => {
  // get text items to export
  const ids = $.map(
    $(stackDOM.children).not('.date, .filtered'),
    (item, index) => {
      return $(item).attr('id')
    })

  // create exporting content
  const content = Array.from(stack)
    .filter(item => ids.includes(item.id))
    .reduce((content, item) => {
      // remove html tags
      const sanitizedContent = $('<div>', {
        html: item.content
      }).text();
      // 
      content += `${sanitizedContent}\n`;
      if (typeof item.footnote.pageTitle !== 'undefined') {
        content += item.footnote.pageTitle + '\n';
      }
      if (typeof item.footnote.url !== 'undefined') {
        content += item.footnote.url + "\n";
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

  // download
  chrome.downloads.download({
    url: url,
    filename: formatDate() + '.txt',
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
      tags: []
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

  // render the ga
  $('#textstack').append(wrapper);
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
    // show toolbox
    $('#toolbox').show();
    $('#statusboard').text('');
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
      // NORMAL MODE
      let notesHTML = "";
      stack.forEach(res => {
        notesHTML += generateNoteItemHTML(res);
      });

      // insert current time
      let now = new Date();
      let hours = ('0' + now.getHours()).slice(-2);
      let minutes = ('0' + now.getMinutes()).slice(-2);

      // add
      let currentDate = `<div class="date current">${formatDate() + ' ' + hours + ":" + minutes}</div>`
      notesHTML += currentDate;

      // insert HTML
      document.querySelector('#textstack').insertAdjacentHTML('afterbegin', notesHTML)

      // insert separators between items
      insertDateSeparator();

      $('.stackwrapper').each((index, item) => {
        // console.log(item);
        attachTagInputEvents(item);
        attachNoteContentEvents(item);
      })
    }
  });

};

/**
 * insert date as a separator
 */
const insertDateSeparator = () => {
  stack.forEach((item) => {
    let date = new Date(item.date);
    if (dateStack.length === 0) {
      dateStack.push({ id: item.id, date: date });
    } else {
      // insert only between the date and the previous date
      if (formatDate(new Date(dateStack[dateStack.length - 1].date)) !== formatDate(new Date(date))) {
        dateStack.push({ id: item.id, date: date });
      }
    }
  })

  dateStack.forEach(item => {
    $(stackDOM.children).each((index, wrapper) => {
      if ($(wrapper).attr("id") === item.id) {
        $(wrapper).get(0).insertAdjacentHTML('beforebegin', `<div class="date">${formatDate(item.date)}</div>`);
      }
    });
  })
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
        if (typeof state.sortedByNew !== 'undefined') {
          sortNotes(state.sortedByNew)
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

// ========== INITIALIZATION ==========
// initialize
document.addEventListener('DOMContentLoaded', () => {
  // importFromJsonFile("/importData.json").then(() => {
  //   // convertDateToDateTimeFormat();
  //   initializeEventListeners();
  //   renderStack();
  //   restorePreviousState();
  // })

  initializeEventListeners();
  renderStack();
  restorePreviousState();

});

document.addEventListener('keyup', (e) => {
  // refresh with F5
  if (e.keyCode === 116) {
    renderStack();
  }
})
