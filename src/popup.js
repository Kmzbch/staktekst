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
const sortBy = document.querySelector('.sort-by');
const topOpener = (
  () => {
    let elem = document.querySelector('.opener-top');
    if (elem === null) {
      elem = document.createElement('i');
      elem.className = 'material-icons';
      elem.classList.add('opener-top');
      elem.textContent = 'post_add';
    }
    return elem;
  }
)();
const textareaOpener = document.querySelector('.opener');
const textarea = document.querySelector('.add-textitem');
const stackDOM = document.querySelector('.textstack');
const resetBtn = document.querySelector('.resetBtn');
const viewSwitcher = (
  () => {
    let elem = document.querySelector('.switchview');
    if (elem === null) {
      elem = document.createElement('i');
      elem.className = 'material-icons';
      elem.classList.add('switchview');
      elem.textContent = 'reorder';
    }
    return elem;
  }
)();
const tagArea = document.querySelector('#tagarea');


let stack = [];
let tagStack = ['note'];

let dateStack = [];
let timer = null;

// const Observable = require('./Observable')
// const Observer = require('./Observer')

// const observable = new Observable();
// const observer1 = new Observer(stack);
// observable.subscribe(observer1);

// observable.notifyAll()



/* switcher */
const switchViewStyles = () => {
  const defaultStyles = document.querySelector('#style_default');
  const listviewStyles = document.querySelector('#style_listview');

  if (defaultStyles.disabled) {
    defaultStyles.disabled = false;
    listviewStyles.disabled = true;
    viewSwitcher.textContent = "reorder";

    switchSortOrder({
      byNew: true
    });
  } else {
    defaultStyles.disabled = true;
    listviewStyles.disabled = false;
    viewSwitcher.textContent = "format_list_bulleted";

    switchSortOrder({
      byNew: false
    });
  }

}

const switchSortOrder = ({
  byNew = !sortBy.innerHTML.includes('New')
}) => {
  // let byNew = !sortBy.innerHTML.includes('New');
  if (byNew) {
    sortBy.innerHTML = 'New <i class="material-icons">arrow_upward</i>';
    stackDOM.style.flexDirection = 'column-reverse';
  } else {
    sortBy.innerHTML = 'Old <i class="material-icons">arrow_downward</i>';
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

/* stack operation*/
const renderStackDOM = (content, footnote, date = formatDate()) => {
  // const {
  //   pageTitle: pageTitle,
  //   url
  // } = footnote;
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
      })
    }
  }

  // tag stack
  if (typeof hashtag !== 'undefined') {
    hashtag.forEach(t => {
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

// const addItemToStack = (content) => {
//   stack.push({
//     content: content,
//     date: formatDate(),
//     noteTitle: "",
//     footnote: {
//       pageTitle: "",
//       url: ""
//     }
//   });
//   stackStorage.set(JSON.stringify(stack));
// };
const addItemToStack = (content, footnote = {}) => {
  stack.push({
    content: content,
    date: formatDate(),
    noteTitle: "",
    footnote: {
      pageTitle: "",
      url: "",
      hashtag: footnote.hashtag
    },
  });
  stackStorage.set(JSON.stringify(stack));
};

const filterTextItems = (term) => {
  let termRegex;
  let hits = 0;

  if (containsJapanese(term)) {
    termRegex = new RegExp(`(${escapeRegExp(term)})(.*?)`, 'ig');
  } else {
    termRegex = new RegExp(`\\b(${escapeRegExp(term)})(.*?)\\b`, 'ig');
  }

  Array.from(stackDOM.children)
    .map(item => {
      item.innerHTML = removeHighlight(item.innerHTML);
      if (item.textContent.match(termRegex)) {
        item.classList.remove('filtered');
        hits++;
      } else {
        item.classList.add('filtered');
      }
      return item;
    })
    .filter(item => !item.classList.contains('filtered'))
    .forEach(item => {
      if (term.length >= 1) {
        let endIndex = item.innerHTML.search(/<i class="material-icons checkbox">check<\/i>/i);
        let textContent = item.innerHTML.substring(0, endIndex);
        let cutoff = item.innerHTML.substring(endIndex, item.innerHTML.length)
        item.innerHTML = addHighlight(textContent, termRegex) + cutoff;
      }
    });
  headerBoard.textContent = hits === 0 ? 'No Results' : `${hits} of ${stackDOM.children.length}`;
};

/* initializer */
const renderTextStack = () => {
  stackStorage.get(raw => {
    if (typeof raw === 'undefined') {
      stackStorage.reset();
    } else {
      stack = JSON.parse(raw);
      stack.forEach(res => {
        renderStackDOM(res.content, res.footnote, res.date);
      });
      tagStack = tagStack.sort();
    }
  });
};

const initializeEventListeners = () => {
  window.onscroll = switchStickyVisibility;

  /* searchbox */
  searchbox.addEventListener('input', (e) => {
    const term = searchbox.value.trim().toLowerCase();
    filterTextItems(term);
    // change styles on search
    if (term) {
      searchCancelBtn.style = 'display: block !important';
      footer.style.display = 'none';
      toolBox.style.display = 'none';
    } else {
      searchCancelBtn.style = 'display: none !important';
      footer.style.display = 'block';
      headerBoard.textContent = '';
      toolBox.style.display = 'flex';
    }

  });

  searchbox.addEventListener('keyup', (e) => {
    // if (searchbox.value.slice(0, 1) === '#') {
    if (e.keyCode === 38 && e.ctrlKey) {
      let tagQuery = tagStack.pop();
      if (searchbox.value === '#' + tagQuery) {
        tagStack.unshift(tagQuery);
        tagQuery = tagStack.pop();
      }
      searchbox.value = '#' + tagQuery;
      tagStack.unshift(tagQuery);
      searchbox.dispatchEvent(new Event('input'));
    } else if (e.keyCode === 40 && e.ctrlKey) {
      let tagQuery = tagStack.shift();
      if (searchbox.value === '#' + tagQuery) {
        tagStack.push(tagQuery);
        tagQuery = tagStack.shift();
      }
      searchbox.value = '#' + tagQuery;
      tagStack.push(tagQuery);
      searchbox.dispatchEvent(new Event('input'));
    }

    // }

  })

  searchCancelBtn.addEventListener('click', () => {
    searchbox.value = '';
    searchbox.dispatchEvent(new Event('input'));
  })

  /* add-sort container */

  topOpener.addEventListener('click', () => {
    textareaOpener.dispatchEvent(new Event('click'));
  });

  textareaOpener.addEventListener('mouseover', () => {
    textareaOpener.textContent = 'post_add';
  })

  textareaOpener.addEventListener('mouseout', () => {
    textareaOpener.textContent = 'add';
  })

  textareaOpener.addEventListener('click', () => {

    toolBox.style.display = 'none';

    textareaOpener.style.display = 'none';
    sortBy.style.display = 'none';
    textarea.style.display = 'flex';
    tagarea.style.display = 'flex';

    textarea.focus();
  });

  /* textarea */
  textarea.addEventListener('focus', (e) => {
    if (tagArea.childElementCount === 0) {
      let defaultTag = document.createElement('span');
      defaultTag.classList.add('hashtag');
      defaultTag.classList.add('default');
      defaultTag.textContent = 'note';
      //

      tagArea.appendChild(defaultTag);
    }
    if (!headerBoard.classList.contains('entering')) {
      headerBoard.classList.add('entering');
    }
    let info = extractTextInfo(e.target.value);
    headerBoard.innerHTML = `${info.wordCount} words<span class="inlineblock">${info.charCount} chars</span>`;
  });

  textarea.addEventListener('input', (e) => {

    adjustDOMHeight(textarea, 25);

    toolBox.style.display = "none";

    if (timer) {
      clearTimeout(timer)
    }
    if (!headerBoard.classList.contains('entering')) {
      headerBoard.classList.add('entering');
    }

    let info = extractTextInfo(e.target.value);

    let err = tagArea.querySelector('.error');
    if (err !== null) {
      err.parentElement.removeChild(err);
    }

    let tags = e.target.value.match(/(^|\s)((#|＃)[^\s]+)(\s$|\n)/);

    if (tags !== null) {
      let regex = new RegExp(`(^|\\s)${escapeRegExp(tags[2])}(\\s$|\\n)`);
      let tagsAdded = tagarea.querySelectorAll('.hashtag').length;
      console.log(tagsAdded);
      if (tagsAdded >= 5) {
        const errorMessage = document.createElement('span');
        errorMessage.className = 'error';
        errorMessage.textContent = 'タグは最大5個まで';
        tagarea.appendChild(errorMessage);
      } else {
        e.target.value = e.target.value.replace(regex, '')
        if (tags) {
          let tagItem = document.createElement('span');
          tagItem.classList.add('hashtag');
          tagItem.textContent = tags[2].slice(1);
          tagItem.addEventListener('click', (e) => {
            e.target.parentElement.removeChild(e.target);
          });

          tagArea.appendChild(tagItem);
        }
      }


    }

    headerBoard.innerHTML = `${info.wordCount} words<span class="inlineblock">${info.charCount} chars</span>`;
  })


  // textarea.addEventListener('focusout', () => {
  //   if (headerBoard.classList.contains('entering')) {
  //     headerBoard.classList.remove('entering');
  //   }
  //   headerBoard.textContent = '';

  //   toolBox.style.display = 'flex';

  //   textareaOpener.style.display = 'block';
  //   sortBy.style.display = 'inline-block';
  //   textarea.style.display = 'none';
  //   tagArea.style.display = 'none';
  // });


  header.addEventListener('mouseover', () => {
    // while (tagArea.firstChild) {
    //   tagArea.removeChild(tagArea.firstChild);
    // }

    if (headerBoard.classList.contains('entering')) {
      headerBoard.classList.remove('entering');
    }
    headerBoard.textContent = '';

    toolBox.style.display = 'flex';

    textareaOpener.style.display = 'block';
    sortBy.style.display = 'inline-block';
    textarea.style.display = 'none';
    tagArea.style.display = 'none';
  })

  stackDOM.addEventListener('mouseover', () => {
    // while (tagArea.firstChild) {
    //   tagArea.removeChild(tagArea.firstChild);
    // }

    if (headerBoard.classList.contains('entering')) {
      headerBoard.classList.remove('entering');
    }
    headerBoard.textContent = '';

    toolBox.style.display = 'flex';

    textareaOpener.style.display = 'block';
    sortBy.style.display = 'inline-block';
    textarea.style.display = 'none';
    tagArea.style.display = 'none';

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

        addItemToStack(text, footnote);
        renderStackDOM(text, footnote);


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
        return false;

      }

    }

  });

  sortBy.addEventListener('click', switchSortOrder);

  /* checkboxes for text stack */
  stackDOM.addEventListener('mouseover', () => {
    textarea.style.display = 'none';
    sortBy.style.display = 'inline-block';
  });

  stackDOM.addEventListener('click', e => {
    // tag filter
    if (e.target.classList.contains('tag')) {
      // searchbox.value = e.target.innerHTML.slice(1);
      searchbox.value = e.target.innerHTML;

      searchbox.dispatchEvent(new Event('input'));
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
          const lists = Array.from(stackDOM.querySelectorAll('.stackwrapper'));
          let index = lists.indexOf(e.target.parentElement);
          removeItemFromStorage(index);
          parent.remove();
          setTimeout(() => {
            headerBoard.textContent = '';
            toolBox.style.display = 'flex';
          }, 700);
        }, 450);
      }
    }

  });

  viewSwitcher.addEventListener('click', switchViewStyles);

  resetBtn.addEventListener('click', () => {
    stackStorage.reset();
    while (stackDOM.firstChild) {
      stackDOM.removeChild(stackDOM.firstChild);
    }
    textarea.value = '';
    stack = [];
    dateStack = [];
  });
}

/* local storage */
const removeItemFromStorage = (index) => {
  stack.splice(index, 1);
  stackStorage.set(JSON.stringify(stack));
}

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
  renderTextStack()
  initializeEventListeners();

  // workaround for view switcher delay
  switchViewStyles();

  document.addEventListener('mouseup', bubble_lib.renderBubble);
});