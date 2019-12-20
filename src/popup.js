import './popup.css';

const header = document.getElementsByTagName('header')[0];
const footer = document.getElementsByTagName('footer')[0];
const searchbox = document.querySelector('.searchbox');
const searchCancelBtn = document.querySelector('.search-cancel');
const results = document.querySelector('.results');
const addBtn = document.querySelector('.add');
const sortBy = document.querySelector('.sort-by');
const addTextItem = document.querySelector('.add-textitem');
const stackDOM = document.querySelector('.textstack');
const resetBtn = document.querySelector('#resetBtn');

let textStack = [];

/* module-specific utilities */
const restoreTextStack = () => {
  stackStorage.get(raw => {
    if (typeof raw === 'undefined') {
      stackStorage.reset();
    } else {
      textStack = JSON.parse(raw);
      textStack.forEach(res => {
        updateTextStackDOM(res.content, res.url, res.title);
      });
    }
  });
};

const updateTextStackDOM = (content, url = "", title = "") => {
  const MAX_LENGTH = containJapanese(title) ? 25 : 40;

  let abbreviation = title.length > MAX_LENGTH ? `${title.substring(0, MAX_LENGTH)}...` : title;
  let template = `
    <li>
    ${content}
    <i class="material-icons checkbox">check</i>
    <div class="spacer">
    <div class="citation">
    <a class="source" href="${url}" target="_blank">${abbreviation}</a>
    </div>
    </li>
    `;

  stackDOM.innerHTML += template;

  // increase the hight to avoid overflow
  let lastTextItem = stackDOM.lastElementChild;

  while (isOverflown(lastTextItem)) {
    let replacement = document.createElement('li');
    replacement.innerHTML = lastTextItem.innerHTML;
    replacement.style.height = lastTextItem.offsetHeight + 10 + "px";
    stackDOM.removeChild(lastTextItem);
    stackDOM.appendChild(replacement);
    lastTextItem = replacement;
  }

  // consider text item without url as a note
  if (url) {
    lastTextItem.querySelector('.citation').innerHTML = `<a class="source" href="${url}" target="_blank">${abbreviation}</a>`;
  } else {
    lastTextItem.className += "note";
    lastTextItem.querySelector('.citation').innerHTML = `<span class="source">#note</span>`;
  }
}

function sortByOld(byOld = false) {
  if (byOld) {
    sortBy.innerHTML = 'Old <i class="material-icons">arrow_downward</i>';
    stackDOM.style.flexDirection = 'column';
  } else {
    sortBy.innerHTML = 'New <i class="material-icons">arrow_upward</i>';
    stackDOM.style.flexDirection = 'column-reverse';
  }
}

function updateStack(content, url = "", title = "", date = formatCurrentDate()) {
  textStack.push({
    content: content,
    url,
    title,
    date
  });
  stackStorage.set(JSON.stringify(textStack));
};

const filterTextItems = (term) => {
  let termRegex;

  // serach by word in English
  if (containJapanese(term)) {
    termRegex = new RegExp(`(${escapeRegExp(term)})(.*?)`, 'ig');
  } else {
    termRegex = new RegExp(`\\b(${escapeRegExp(term)})(.*?)\\b`, 'ig');
  }

  let hitCount = 0;

  Array.from(stackDOM.children).forEach(item => {
    item.innerHTML = item.innerHTML.replace(/<span class="highlighted">(.*?)<\/span>/g, '$1');
  });

  // filter unmatched items
  Array.from(stackDOM.children)
    .filter(item => !item.textContent.match(termRegex))
    .forEach(item => item.classList.add('filtered'));

  // matched items
  Array.from(stackDOM.children)
    .filter(item => item.textContent.match(termRegex))
    .forEach(item => {
      item.classList.remove('filtered');
      // add highlight
      if (term.length >= 1) {
        let endIndex = item.innerHTML.search(/<i class="material-icons checkbox">check<\/i>/i);
        let targetText = item.innerHTML.substring(0, endIndex);
        let rest = item.innerHTML.substring(endIndex, item.innerHTML.length)
        item.innerHTML = targetText.replace(termRegex, "<span class='highlighted'>$1</span>$2") + rest;
      }
      hitCount++;
    });
  results.textContent = hitCount === 0 ? 'No Results' : `${hitCount} of ${stackDOM.children.length}`;
};

/* initialize events */
function initializeEventListeners() {
  window.onscroll = () => {
    // hide header and footer except on the top, bottom and on hover
    if (window.pageYOffset == 0) {
      header.style.opacity = '1';
      footer.style.opacity = '1';
    } else if ((document.body.offsetHeight + window.scrollY) >= document.body.scrollHeight) {
      header.style.opacity = '1';
      footer.style.opacity = '1';
    } else {
      header.style.opacity = '0';
      footer.style.opacity = '0';
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
      results.textContent = '';
    }

  });

  searchbox.addEventListener('keydown', (e) => {
    if (e.keyCode === 38) {
      // up
      sortByOld(false);
    } else if (e.keyCode === 40) {
      // down
      sortByOld(true);
    }
  });

  searchCancelBtn.addEventListener('click', () => {
    searchbox.value = "";
    searchbox.dispatchEvent(new Event('input'));
  })

  /* add-sort container */
  addBtn.addEventListener('click', () => {
    addTextItem.style.display = 'flex';
    addBtn.style.display = 'none';
    sortBy.style.display = 'none';

    addTextItem.focus();
  });


  stackDOM.addEventListener('mouseover', () => {
    addTextItem.style.display = 'none';
    addBtn.style.display = 'inline';
    sortBy.style.display = 'inline-flex';
    let checkboxes = document.querySelectorAll('.checkbox')
    for (let i = 0; i < checkboxes.length; i++) {
      checkboxes[i].classList.remove('hide');
    }
  });

  // hide checkboxes while entering
  addTextItem.addEventListener('focus', (e) => {
    if (!results.classList.contains('entering')) {
      results.classList.add('entering');
    }
    let charCount = e.target.value.length;
    let wordCount = charCount === 0 ? 0 : e.target.value.split(' ').length;
    results.innerHTML = `${wordCount} words<span class="inlineblock">${charCount} chars</span>`;

    let checkboxes = document.querySelectorAll('.checkbox')
    for (let i = 0; i < checkboxes.length; i++) {
      checkboxes[i].classList.add('hide');
    }
  });

  addTextItem.addEventListener('focusout', (e) => {
    results.classList.remove('entering');
    results.textContent = "";
    addTextItem.style.display = 'none';
    addBtn.style.display = 'block';
    sortBy.style.display = 'inline-flex';
    let checkboxes = document.querySelectorAll('.checkbox')
    for (let i = 0; i < checkboxes.length; i++) {
      checkboxes[i].classList.remove('hide');
    }
  });

  addTextItem.addEventListener('input', (e) => {
    if (!results.classList.contains('entering')) {
      results.classList.add('entering');
    }
    let charCount = e.target.value.length;
    let wordCount = charCount === 0 ? 0 : e.target.value.split(' ').length;
    results.innerHTML = `${wordCount} words<span class="inlineblock">${charCount} chars</span>`;
  })

  addTextItem.addEventListener('keyup', (e) => {

    if (e.keyCode === 13) {
      const item = addTextItem.value.trim();
      updateStack(item);
      updateTextStackDOM(item);



      results.classList.remove('entering');
      results.textContent = "Item Added!";
      addTextItem.value = '';
      // hide checkbox
      stackDOM.lastElementChild.querySelector('.checkbox').classList.add('hide');
      return false;
    }
  });

  /* sort by */
  sortBy.addEventListener('click', () => {
    sortByOld(sortBy.innerHTML.includes('New'));
  });



  /* checkboxes for text stack */
  stackDOM.addEventListener('click', e => {
    if (e.target.classList.contains('checkbox')) {
      let parent = e.target.parentElement;
      e.target.style = 'color: white !important;';

      parent.style.color = 'black !important'
      parent.style.opacity = '0.5';

      parent.style.textDecoration = 'line-through';
      results.textContent = "Item Deleted!";

      // remove
      setTimeout(() => {
        const lists = Array.from(stackDOM.querySelectorAll("li"));
        const index = lists.indexOf(e.target.parentElement);
        deleteItemFromStorage(index);
        parent.remove();
        // textStackDOM.removeChild(e.target.parentElement);
        setTimeout(() => {
          results.textContent = "";
        }, 700);

      }, 450);
    }
  });

  resetBtn.addEventListener('click', () => {

    // popupImage();
    stackStorage.reset();
    while (stackDOM.firstChild) {
      stackDOM.removeChild(stackDOM.firstChild);
    }
    addTextItem.value = '';
    textStack = [];
  });
}

function deleteItemFromStorage(index) {
  textStack.splice(index, 1);
  stackStorage.set(JSON.stringify(textStack));
}

const stackStorage = {
  get: callback => {
    chrome.storage.sync.get(['raw'], result => {
      callback(result.raw);
    });
  },
  set: (value) => {
    chrome.storage.sync.set({
      raw: value,
    });
  },
  reset: () => {
    chrome.storage.sync.set({
      raw: '[]'
    });
  }
};

/* utilities */
function formatCurrentDate() {
  let current = new Date();

  let yyyy = current.getFullYear();
  let mm = current.getMonth();
  let dd = current.getDay();
  if (mm < 10) {
    mm = '0' + mm;
  }
  if (dd < 10) {
    dd = '0' + dd;
  }

  return `${yyyy}-${mm}-${dd}`;
}

function containJapanese(str) {
  return (str.match(/[\u30a0-\u30ff\u3040-\u309f\u3005-\u3006\u30e0-\u9fcf]+?/)) ? true : false
}

function isOverflown({
  clientWidth,
  clientHeight,
  scrollWidth,
  scrollHeight
}) {
  return scrollHeight > clientHeight || scrollWidth > clientWidth;
}

function escapeRegExp(string) {
  const reRegExp = /[\\^$.*+?()[\]{}|]/g,
    reHasRegExp = new RegExp(reRegExp.source);

  return (string && reHasRegExp.test(string)) ?
    string.replace(reRegExp, '\\$&') :
    string;
}

/* */
document.addEventListener('DOMContentLoaded', () => {
  restoreTextStack()
  initializeEventListeners();
});

function popupImage() {
  var popup = document.getElementById('js-popup');
  if (!popup) return;

  var blackBg = document.getElementById('js-black-bg');

  var blackBg = document.getElementById('js-black-bg');
  var closeBtn = document.getElementById('js-close-btn');
  var showBtn = document.getElementById('js-show-popup');

  closePopUp(blackBg);
  closePopUp(closeBtn);
  closePopUp(showBtn);

  function closePopUp(elem) {
    if (!elem) return;
    elem.addEventListener('click', function () {
      popup.classList.toggle('is-show');
    });
  }
}