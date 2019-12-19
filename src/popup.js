import './popup.css';

const header = document.getElementsByTagName('header')[0];
const footer = document.getElementsByTagName('footer')[0];
const searchbox = document.querySelector('.searchbox');
const searchCancelBtn = document.querySelector('.search-cancel');
const results = document.querySelector('.results');

const addBtn = document.querySelector('.add');
const sortBy = document.querySelector('.sort-by');
const addTextItem = document.querySelector('.add-textitem');

const textStackDOM = document.querySelector('.textstack');
const resetBtn = document.querySelector('#resetBtn');

let textStack = [];

/* module-specific utilities */
function restoreTextStack() {
  stackStorage.get(raw => {
    if (typeof raw === 'undefined') {
      stackStorage.reset();
    } else {
      textStack = JSON.parse(raw);
      textStack.forEach(res => {
        updateTextStackDOM(res.text, res.url, res.title);
      });
    }
  });
};

const updateTextStackDOM = (item, url = "", title = "") => {
  const MAX_LENGTH = 40;
  let abbreviation = title.length > MAX_LENGTH ? `${title.substring(0, MAX_LENGTH)}...` : title;

  let html = `
    <li>
    ${item}
    <i class="material-icons deleteItem">check</i>
    <div class="spacer">
    <div class="citation">
    <a class="source" href="${url}" target="_blank">${abbreviation}</a>
    </div>
    </li>
    `;

  textStackDOM.innerHTML += html;

  // increase the hight to avoid overflow
  let lastChild = textStackDOM.lastElementChild;

  while (isOverflown(lastChild)) {
    let replacement = document.createElement('li');
    replacement.innerHTML = lastChild.innerHTML;
    replacement.style.height = lastChild.offsetHeight + 10 + "px";
    textStackDOM.removeChild(lastChild);
    textStackDOM.appendChild(replacement);
    lastChild = replacement;
  }

  // consider text item without url as a note
  if (url === "") {
    lastChild.className += "note";
  }
}

function sortByOld(byOld = false) {
  if (byOld) {
    sortBy.innerHTML = 'Old <i class="material-icons">arrow_downward</i>';
    textStackDOM.style.flexDirection = 'column';
  } else {
    sortBy.innerHTML = 'New <i class="material-icons">arrow_upward</i>';
    textStackDOM.style.flexDirection = 'column-reverse';
  }
}

function updateStack(text, url = "", title = "") {
  textStack.push({
    text,
    url,
    title
  });
  stackStorage.set(JSON.stringify(textStack));
};

const filterTextItems = (term) => {
  const termRegex = new RegExp(`\\b(${escapeRegExp(term)})(.*?)\\b`, 'ig');
  let hitCount = 0;

  Array.from(textStackDOM.children).forEach(item => {
    item.innerHTML = item.innerHTML.replace(/<span class="highlighted">(.*?)<\/span>/g, '$1');
  });

  // filter unmatched items
  Array.from(textStackDOM.children)
    .filter(item => !item.textContent.match(termRegex))
    .forEach(item => item.classList.add('filtered'));

  // matched items
  Array.from(textStackDOM.children)
    .filter(item => item.textContent.match(termRegex))
    .forEach(item => {
      item.classList.remove('filtered');
      // add highlight
      if (term.length >= 1) {
        let endIndex = item.innerHTML.search(/<i class="material-icons deleteItem">check<\/i>/i);
        let targetText = item.innerHTML.substring(0, endIndex);
        let rest = item.innerHTML.substring(endIndex, item.innerHTML.length)
        item.innerHTML = targetText.replace(termRegex, "<span class='highlighted'>$1</span>$2") + rest;
      }
      hitCount++;
    });
  results.textContent = hitCount === 0 ? 'No Results' : `${hitCount} of ${textStackDOM.children.length}`;
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
  searchbox.addEventListener('input', () => {
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

  addTextItem.addEventListener('focusout', () => {
    addTextItem.style.display = 'none';
    addBtn.style.display = 'block';
    sortBy.style.display = 'inline-flex';
  });

  addTextItem.addEventListener('keyup', (e) => {
    if (e.keyCode === 13) {
      const item = addTextItem.value.trim();
      updateStack(item);
      updateTextStackDOM(item);
      addTextItem.value = '';

      return false;
    }
  });

  sortBy.addEventListener('click', () => {
    sortByOld(sortBy.innerHTML.includes('New'));
  });

  resetBtn.addEventListener('click', () => {
    stackStorage.reset();
    while (textStackDOM.firstChild) {
      textStackDOM.removeChild(textStackDOM.firstChild);
    }
    addTextItem.value = '';
    textStack = [];
  });
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
const isOverflown = ({
  clientWidth,
  clientHeight,
  scrollWidth,
  scrollHeight
}) => {
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


  setTimeout(() => {
    let deleteBoxes = document.querySelectorAll('.deleteItem');

    console.log(deleteBoxes);
    for (let i = 0; i < deleteBoxes.length; i++) {
      deleteBoxes[i].addEventListener('click', () => {
        deleteBoxes[i].style = 'color: white !important';
        console.log(deleteBoxes[i]);
        // deleteBoxes[i].parentElement.style = ''
        deleteBoxes[i].parentElement.className += 'deleted';
        // setTimeout(() => {
        //   removeTextItem();
        // }, 500);
      })
    }

  }, 30)

});

// function removeTextItem() {
//   Array.from(textStackDOM.children)
//   .filter(item => !item.textContent.includes('deleted'))
//   .forEach(item => item.classList.add('filtered'));
// }