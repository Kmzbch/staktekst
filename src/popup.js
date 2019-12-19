import './popup.css';

const header = document.getElementsByTagName("header")[0];
const footer = document.getElementsByTagName("footer")[0];
const searchbox = document.querySelector('.searchbox');
const searchCancelBtn = document.querySelector('.search-cancel');
const results = document.querySelector('.results');

const addBtn = document.querySelector(".add");
const sortBy = document.querySelector('.sort-by');
const addTextItem = document.querySelector(".add-textitem");

const itemListDOM = document.querySelector('.itemlist');
const resetBtn = document.querySelector('#resetBtn');

let itemList = [];

const updateItemListDOM = (item, url = "", title = "") => {
  let omit = title;
  if (omit.length > 40) {
    omit = omit.substring(0, 40) + '...';
  }


  let html;
  if (url === "") {
    html = `
    <li class="note">
    ${item}
    <i class="material-icons deleteItem">delete</i>
    <div class="spacer">
    <div class="cardBottom">
    <span class="source">note</span>
    </div>
    </li>
    `;

  } else {
    html = `
    <li>
    ${item}
    <i class="material-icons deleteItem">delete</i>
    <div class="spacer">
    <div class="cardBottom">
    <a class="source" href="${url}" target="_blank">${omit}</a>
    </div>
    </li>
    `;

  }
  itemListDOM.innerHTML += html;
  // increase the hight to avoid overflow
  let lastChild = itemListDOM.lastElementChild;

  while (isOverflown(lastChild)) {
    let replacement = document.createElement('li');
    replacement.innerHTML = lastChild.innerHTML;
    replacement.style.height = lastChild.offsetHeight + 10 + "px";
    itemListDOM.removeChild(lastChild);
    itemListDOM.appendChild(replacement);
    lastChild = replacement;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  restoreItemList()
  initilaizeControls();
});

/* */
function restoreItemList() {
  stackStorage.get(raw => {
    if (typeof raw === "undefined") {
      stackStorage.reset();
    } else {
      itemList = JSON.parse(raw);
      itemList.forEach(res => {
        updateItemListDOM(res.text, res.url, res.title);
      });
    }
  });
};

/* initialize events */
function initilaizeControls() {
  /* window */
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
  })

  searchCancelBtn.addEventListener("click", () => {
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

  addTextItem.addEventListener('focusout', (e) => {
    addTextItem.style.display = 'none';

    addBtn.style.display = 'block';
    sortBy.style.display = 'inline-flex';
  });

  addTextItem.addEventListener("keyup", (e) => {
    if (e.keyCode === 13) {
      const item = addTextItem.value.trim();

      updateStack(item);
      updateItemListDOM(item);
      addTextItem.value = "";

      return false;
    }
  });


  sortBy.addEventListener('click', () => {
    if (sortBy.innerHTML.includes('New')) {
      sortBy.innerHTML = `Old <i class="material-icons">arrow_downward</i>`;
      itemListDOM.style.flexDirection = 'column';
    } else {
      sortBy.innerHTML = `New <i class="material-icons">arrow_upward</i>`;
      itemListDOM.style.flexDirection = 'column-reverse';
    }
  });


  resetBtn.addEventListener('click', () => {
    stackStorage.reset();
    while (itemListDOM.firstChild) {
      itemListDOM.removeChild(itemListDOM.firstChild);
    }
    addTextItem.value = "";
    itemList = [];
  });

}


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

function updateStack(text, url = "", title = "") {
  itemList.push({
    text,
    url,
    title
  });
  stackStorage.set(JSON.stringify(itemList));
};

const filterTextItems = (term) => {

  // remove highlight
  // /\b(what you're).*?\b/ig
  Array.from(itemListDOM.children).forEach(item => {
    item.innerHTML = item.innerHTML.replace(/(<span class="highlight">|<\/span>)/g, '');
  });

  let regexp = new RegExp('\\b(' + escapeRegExp(term) + ')(.*?)\\b', 'ig');
  Array.from(itemListDOM.children)
    .filter((item) => !item.textContent.match(regexp))
    .forEach((item) => item.classList.add('filtered'));

  let hitItemCount = 0;
  Array.from(itemListDOM.children)
    .filter((item) => item.textContent.match(regexp))
    .forEach((item) => {
      hitItemCount++;
      item.classList.remove('filtered');
      if (term.length >= 1) {
        // let x = item.innerHTML.search(/<div class="spacer">/i);
        let x = item.innerHTML.search(/<i class="material-icons deleteItem">delete<\/i>/i);

        let y = item.innerHTML.substring(0, x);
        let z = item.innerHTML.substring(x, item.innerHTML.length)
        // item.innerHTML = item.innerHTML.replace(regexp, "<span class='highlight'>$1</span>$2");
        item.innerHTML = y.replace(regexp, "<span class='highlight'>$1</span>$2") + z;

      }
    });
  console.log(hitItemCount + '/' + itemListDOM.children.length + 'found!');
  if (hitItemCount === 0) {
    results.textContent = 'No Results';
  } else {
    results.textContent = hitItemCount + ' of ' + itemListDOM.children.length;
  }

};

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