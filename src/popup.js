import './popup.css';
// import './popup_listview.css';

import {
  escapeRegExp,
  extractTextInfo,
  containsJapanese,
  formatDate
} from './common_lib.js';

const header = document.querySelector('header');
const footer = document.querySelector('footer');
const searchbox = document.querySelector('.searchbox');
const searchCancelBtn = document.querySelector('.search-cancel');
const headerBoard = document.querySelector('.header-board');
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

let stack = [];
let dateStack = [];



// document.addEventListener('DOMContentLoaded', function () {
//   if (window.outerWidth > 465) {
//     console.log(document.URL);
//     let elem = document.createElement('div');
//     elem.id = 'hiddenContainer';
//     elem.innerHTML = '<iframe id="hiddenIframe" src="https://www.vocabulary.com/dictionary/identity"></iframe>';
//     document.body.append(elem);

//   }
// })


function switchStyles() {
  const defaultStyles = document.querySelector('#style_default');
  const listviewStyles = document.querySelector('#style_listview');

  if (defaultStyles.disabled) {
    defaultStyles.disabled = false;
    listviewStyles.disabled = true;
    // searchCancelBtn.dispatchEvent(new Event('click'));
  } else {
    // searchbox.value = '#note';
    // searchbox.dispatchEvent(new Event('input'));
    defaultStyles.disabled = true;
    listviewStyles.disabled = false;

  }
}
const viewSwitcher = document.querySelector('.switchview');

viewSwitcher.addEventListener('click', () => {
  switchStyles();
});



/* module-specific utilities */
const renderStackDOM = (content, footnote, date = formatDate()) => {
  const {
    pageTitle: pageTitle,
    url
  } = footnote;
  const MAX_LENGTH = containsJapanese(pageTitle) ? 25 : 40;
  const abbreviation = pageTitle.length > MAX_LENGTH ? `${pageTitle.substring(0, MAX_LENGTH)}...` : pageTitle;

  // const template = `
  //   <div class="stackwrapper">
  //     <input type="text" class="title-input">
  //     ${content}
  //     <i class="material-icons checkbox">check</i>
  //     <div class="spacer"></div>
  //     <div class="footnote"></div>
  //   </div>
  //   `;
  // const template = `<div class="stackwrapper">${content}<i class="material-icons checkbox">check</i><input type="date" class="calendar"><div class="spacer"></div><div class="footnote"></div></div>`;
  const template = `<div class="stackwrapper">${content}<i class="material-icons checkbox">check</i><div class="spacer"></div><div class="footnote"></div></div>`;

  stackDOM.innerHTML += template;



  // increase the hight to avoid overflow
  let lastTextItem = stackDOM.lastElementChild;

  // consider text item without url as a note
  if (url) {
    lastTextItem.classList.add("clip");
    lastTextItem.querySelector('.footnote').innerHTML = `<a href="${url}" target="_blank">${abbreviation}</a><input type="hidden" value=${pageTitle}>`;
  } else {
    lastTextItem.classList.add("note");
    lastTextItem.querySelector('.footnote').innerHTML = `<span class="tag">#note</span>`;
  }

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

const switchSortOrder = ({
  byNew = true
}) => {
  if (byNew) {
    sortBy.innerHTML = 'New <i class="material-icons">arrow_upward</i>';
    stackDOM.style.flexDirection = 'column-reverse';
  } else {
    sortBy.innerHTML = 'Old <i class="material-icons">arrow_downward</i>';
    stackDOM.style.flexDirection = 'column';
  }
}

// const updateItem = (title, content) => {
//   let pos = stack.map((e) = e.content).indexOf(content);
//   console.log(title);
//   console.log(pos);
//   // stack.push({
//   //   content: content,
//   //   date: formatDate(),
//   //   noteTitle: "",
//   //   footnote: {
//   //     pageTitle: "",
//   //     url: ""
//   //   }
//   // });
//   // stackStorage.set(JSON.stringify(stack));
// };

const addItemToStack = (content) => {
  stack.push({
    content: content,
    date: formatDate(),
    noteTitle: "",
    footnote: {
      pageTitle: "",
      url: ""
    }
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
    }
  });
};

const initializeEventListeners = () => {
  window.onscroll = () => {
    // show header and footer when scroll to the top/bottom
    if (window.pageYOffset == 0) {
      header.style.opacity = '1';
      footer.style.opacity = '1';
      setTimeout(() => {
        headerBoard.parentNode.removeChild(topOpener);
      }, 60);
    } else if (document.body.offsetHeight + window.scrollY >= document.body.scrollHeight) {
      header.style.opacity = '1';
      footer.style.opacity = '1';
      headerBoard.parentNode.insertBefore(topOpener, headerBoard);
    } else {
      header.style.opacity = '0';
      footer.style.opacity = '0';
      setTimeout(() => {
        headerBoard.parentNode.insertBefore(topOpener, headerBoard);
      }, 50);
    }
  }

  /* searchbox */
  searchbox.addEventListener('input', (e) => {
    const term = searchbox.value.trim().toLowerCase();
    filterTextItems(term);
    // change styles on search
    if (term) {
      searchCancelBtn.style = 'display: block !important';
      footer.style.display = 'none';
    } else {
      searchCancelBtn.style = 'display: none !important';
      footer.style.display = 'block';
      headerBoard.textContent = '';
    }
  });

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
    topOpener.style.display = 'none';
    textareaOpener.style.display = 'none';
    sortBy.style.display = 'none';
    textarea.style.display = 'flex';
    textarea.focus();
  });

  /* textarea */
  textarea.addEventListener('focus', (e) => {
    if (!headerBoard.classList.contains('entering')) {
      headerBoard.classList.add('entering');
    }
    let info = extractTextInfo(e.target.value);
    headerBoard.innerHTML = `${info.wordCount} words<span class="inlineblock">${info.charCount} chars</span>`;
  });

  textarea.addEventListener('input', (e) => {
    if (!headerBoard.classList.contains('entering')) {
      headerBoard.classList.add('entering');
    }
    let info = extractTextInfo(e.target.value);
    headerBoard.innerHTML = `${info.wordCount} words<span class="inlineblock">${info.charCount} chars</span>`;
  })

  textarea.addEventListener('focusout', () => {
    if (headerBoard.classList.contains('entering')) {
      headerBoard.classList.remove('entering');
    }
    headerBoard.textContent = "";
    topOpener.style.display = 'inline';

    textareaOpener.style.display = 'block';
    sortBy.style.display = 'inline-block';
    textarea.style.display = 'none';
  });

  textarea.addEventListener('keyup', (e) => {
    if (e.keyCode === 13) {
      let text = textarea.value.trim();
      if (text === '' || text === '\n') {
        textarea.value = '';
        textarea.dispatchEvent(new Event('focusout'));
        return false;
      }

      let footnote = {
        pageTitle: "",
        url: ""
      };

      addItemToStack(text);
      renderStackDOM(text, footnote);

      headerBoard.classList.remove('entering');
      headerBoard.textContent = "Item Added!";
      textarea.value = '';
      return false;
    }

  });

  /* sort by */
  sortBy.addEventListener('click', () => {
    switchSortOrder({
      byNew: !sortBy.innerHTML.includes('New')
    })
  });

  /* checkboxes for text stack */
  stackDOM.addEventListener('mouseover', () => {
    textarea.style.display = 'none';
    sortBy.style.display = 'inline-block';
  });

  stackDOM.addEventListener('click', e => {
    // tag filter
    if (e.target.classList.contains('tag')) {
      console.log(e.target.innerHTML);
      searchbox.value = e.target.innerHTML.slice(1);
      searchbox.dispatchEvent(new Event('input'));
    } else {

      if (e.target.classList.contains('checkbox')) {
        const parent = e.target.parentElement;

        // apply visual effects for removing text items
        e.target.style = 'color: white !important;';
        parent.style.color = 'black !important'
        parent.style.opacity = '0.5';
        parent.style.textDecoration = 'line-through';
        headerBoard.textContent = "Item Removed!";

        // remove
        setTimeout(() => {
          const lists = Array.from(stackDOM.querySelectorAll('.stackwrapper'));
          let index = lists.indexOf(e.target.parentElement);
          removeItemFromStorage(index);
          parent.remove();
          setTimeout(() => {
            headerBoard.textContent = "";
          }, 700);
        }, 450);
      }
    }

  });

  // to do: title form
  // stackDOM.addEventListener('dblclick', e => {
  //   let titleInput = e.target.querySelector('.title-input');
  //   console.log(titleInput);
  //   titleInput.style.display = "block";
  //   titleInput.focus();
  //   titleInput.addEventListener('keyup', (e) => {
  //     if (e.keyCode === 13) {
  //       let title = e.target.value.trim();
  //       let content = e.target.parentElement.textContent;
  //       console.log(content);
  //       // let footnote = {
  //       //   pageTitle: "",
  //       //   url: ""
  //       // };
  //       // updateItem(title, content);
  //       // // renderStackDOM(text, footnote);

  //       // headerBoard.classList.remove('entering');
  //       // headerBoard.textContent = "Item Updated!";
  //       // console.log(title);
  //       return false;
  //     }



  //   });
  // });


  resetBtn.addEventListener('click', () => {
    stackStorage.reset();
    while (stackDOM.firstChild) {
      stackDOM.removeChild(stackDOM.firstChild);
    }
    textarea.value = '';
    stack = [];
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
  // document.getElementById('style_default').disabled = true;
  // document.getElementById('style_listview').disabled = false;
  renderTextStack()
  initializeEventListeners();
});


/** Bubble */
// bubble stay in the page
import './font-awesome.min.css';
import IconPreset from './IconPreset.js';

const bubbleDOM = createBubbleDOM();

document.body.appendChild(bubbleDOM);

// chrome.runtime.onMessage.addListener(getMessage);
document.addEventListener("mouseup", renderBubble);

// function getMessage(request, sender, sendResponse) {
//   console.log('!!!!');
//   sendResponse({
//       selection: document.getSelection().toString()
//   });
// }
function renderBubble() {
  setTimeout(() => {
    let selection = document.getSelection();

    if (selection.toString() === "") {
      bubbleDOM.style.display = "none";
    } else {
      bubbleDOM.style.display = "flex";

      let boundingCR = selection.getRangeAt(0).getBoundingClientRect();
      bubbleDOM.style.top = (boundingCR.top - 80) + window.scrollY + 'px';
      bubbleDOM.style.left = Math.floor((boundingCR.left + boundingCR.right) / 2) - 50 + window.scrollX + 'px';
    }
  }, 30)
}

function sendCommandMessage(command) {
  let textitem = window.getSelection().getRangeAt(0).commonAncestorContainer.parentElement;
  let aTag, url, title;
  if (textitem.classList.contains('clip')) {
    aTag = textitem.querySelector('a');
    url = aTag.href;
    title = textitem.querySelector('input').value || null;
  } else {
    url = "";
    title = "";
  }

  let words = document.getSelection().toString();
  words = words.replace(/check\s$/, "");
  console.log(words);
  if (command === "extendedcopy") {
    copyTextWithTitleUrl(words, title, url);
  } else if (command === 'pushtext') {
    addItemToStack(words);
    renderTextStack();
  } else {
    chrome.runtime.sendMessage({
      command: command,
      selection: words
    });
  }
}

function copyTextWithTitleUrl(content, title, url) {
  // use hidden DOM to copy text
  let copyFrom = document.createElement("textarea");
  copyFrom.textContent = content + "\n\n" + title + "\n" + url;
  document.body.appendChild(copyFrom);
  copyFrom.select();
  document.execCommand('copy');
  copyFrom.blur();
  document.body.removeChild(copyFrom);
}


/* DOM creation and manipulation */
function createIconDOM({
  className,
  title,
  innerText = "",
  command
}) {
  let iconDOM = document.createElement("i");
  iconDOM.setAttribute("class", className);
  iconDOM.setAttribute("title", title);
  iconDOM.innerText = innerText;

  iconDOM.addEventListener("mousedown", () => {
    sendCommandMessage(command)
  });

  return iconDOM;
}

function createBubbleDOM() {

  let bubbleDOM = document.createElement("div");
  bubbleDOM.setAttribute("id", "bubble");

  let leftContainer = document.createElement("div");
  leftContainer.setAttribute("id", "leftContainer");

  let rightContainer = document.createElement("div");
  rightContainer.setAttribute("id", "rightContainer");

  IconPreset.SEARCH_ENGINE_ICONS.forEach(icon => {
    leftContainer.appendChild(createIconDOM(icon));
  });
  IconPreset.SYSTEM_COMMAND_ICONS.forEach(icon => {
    rightContainer.appendChild(createIconDOM(icon));
  });

  bubbleDOM.appendChild(leftContainer);
  bubbleDOM.appendChild(rightContainer);

  return bubbleDOM;
}