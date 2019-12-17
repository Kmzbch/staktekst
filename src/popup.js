import './popup.css';

const addStackSpace = document.querySelector("#addStackSpace");
const addTextArea = document.querySelector("#addTextArea");
const textarea = document.querySelector("#addStackText");
const footer = document.getElementsByTagName("footer")[0];
const resetBtn = document.querySelector('#resetBtn');
const itemListDOM = document.querySelector('.itemlist');
const searchbox = document.querySelector('.searchbox');

let itemList = [];

const updateItemListDOM = (item, url = "", title = "") => {
  let omit = title;
  if (omit.length > 50) {
    omit = omit.substring(0, 50) + '...';
  }

  const html = `
  <li>
  ${item}
  <div class="spacer">
  <div class="cardBottom">
  <a class="source" href="${url}" target="_blank">${omit}</a>
  </div>
  </li>
  `;

  itemListDOM.innerHTML += html;

  // increase the hight to avoid overflow
  let lastChild = itemListDOM.lastElementChild;

  // const template2 = `
  // <div class="cardBottom">
  // <input type="checkbox" class="innerCheckbox">
  // <a class="source" href="${url}" target="_blank">${omit}</a>
  // </div>
  // `;

  while (isOverflown(lastChild)) {
    let replacement = document.createElement('li');
    replacement.innerHTML = lastChild.innerHTML;
    replacement.style.height = lastChild.offsetHeight + 10 + "px";
    itemListDOM.removeChild(lastChild);
    itemListDOM.appendChild(replacement);
    lastChild = replacement;
  }

  // let index = lastChild.innerHTML.search('</li>');


  // lastChild.innerHTML = lastChild.innerHTML.slice(0, index) + template2 + lastChild.innerHTML.slice(index);

  // if(isOverflown(lastChild) {

  // }


  // lastChild.addEventListener("mouseover", () => {
  //   lastChild.querySelector('.innerCheckbox').style.display = "block";
  // })
  // lastChild.addEventListener("mouseleave", () => {
  //   lastChild.querySelector('.innerCheckbox').style.display = "none";
  // })

  // aTag.setAttribute("class", "source");
  // aTag.setAttribute("href", url);
  // aTag.setAttribute("target", "_blank");
  // aTag.innerText = title;
  // itemListDOM.lastElementChild.appendChild(aTag);

}


const isOverflown = ({
  clientWidth,
  clientHeight,
  scrollWidth,
  scrollHeight
}) => {
  return scrollHeight > clientHeight || scrollWidth > clientWidth;
}

function updateStack(text, url = "", title = "") {
  itemList.push({
    text,
    url,
    title
  });
  stackStorage.set(JSON.stringify(itemList));
};

(function () {
  document.addEventListener('DOMContentLoaded', function restoreItemList() {
    stackStorage.get(raw => {
      if (typeof raw === "undefined") {
        stackStorage.reset();
      } else {
        itemList = JSON.parse(raw);
        itemList.forEach(res => {
          console.log(res.title);
          updateItemListDOM(res.text, res.url, res.title);
        });
        //
        // let boxes = document.querySelectorAll('li')
        // console.log(boxes);
        // for (let i = 0; i < boxes.length; i++) {
        //   boxes[i].addEventListener("mouseover", () => {
        //     boxes[i].querySelector('.innerCheckbox').style.display = "block";
        //   });
        //   boxes[i].addEventListener("mouseleave", () => {
        //     boxes[i].querySelector('.innerCheckbox').style.display = "none";
        //   })

        // }

      }
    });
  });
})();


const searchCancelButton = document.querySelector('.searchCancelButton');

searchCancelButton.addEventListener("click", () => {
  searchbox.value = "";
  // fire event
  let event = new Event('input');
  searchbox.dispatchEvent(event);
})

// searchbox.addEventListener('input', () => {  
//   const term = searchbox.value.trim().toLowerCase();

//   if (term === "") {
//     searchCancelButton.style = "display: none !important;";
//   } else {
//     searchCancelButton.style = "display: block !important;";
//   }

//   filterItems(term);
// })

let sortOrderDescription = document.querySelector('.sortOrderDescription');
let arrowButton = document.querySelector('.sortOrder');
arrowButton.addEventListener('click', (e) => {
  if (arrowButton.textContent === "arrow_upward") {
    arrowButton.textContent = "arrow_downward";
    itemListDOM.style.flexDirection = "column";
    sortOrderDescription.textContent = 'Old'
  } else {
    arrowButton.textContent = "arrow_upward";
    itemListDOM.style.flexDirection = "column-reverse";
    sortOrderDescription.textContent = 'New'
  }

});

searchbox.addEventListener('keydown', (e) => {
  if (e.keyCode === 38) {
    itemListDOM.style.flexDirection = "column-reverse";
    // searchbox.setAttribute("placeholder", "作成日時が新しい順に表示");
    // document.querySelector('.search-overlay').textContent = "arrow_drop_up";
    document.querySelector('.sortOrder').textContent = "arrow_upward";
    //down
  } else if (e.keyCode === 40) {
    itemListDOM.style.flexDirection = "column";
    // searchbox.setAttribute("placeholder", "作成日時が古い順に表示");
    // document.querySelector('.search-overlay').textContent = "arrow_drop_down";
    document.querySelector('.sortOrder').textContent = "arrow_downward";

  } else {
    // document.querySelector('.search-overlay').textContent = "search";
    // searchbox.setAttribute("placeholder", "テキストを検索...");

  }
});

searchbox.addEventListener('input', (e) => {
  const term = searchbox.value.trim().toLowerCase();

  if (term === "") {
    searchCancelButton.style = "display: none !important;";
  } else {
    searchCancelButton.style = "display: block !important;";
  }

  filterItems(term);

})


// initialize eventListeners
textarea.addEventListener("keyup", (e) => {
  if (e.keyCode === 13) {
    const item = textarea.value.trim();
    updateStack(item);
    updateItemListDOM(item);
    textarea.value = "";
    return false;
  }
});

textarea.addEventListener('focusout', (e) => {
  textarea.style.display = "none";
  addTextArea.style.display = "block";
});
addTextArea.addEventListener('click', () => {
  textarea.style.display = "flex";
  textarea.focus();
  addTextArea.style.display = "none";
});

resetBtn.addEventListener('click', () => {
  stackStorage.reset();
  while (itemListDOM.firstChild) {
    itemListDOM.removeChild(itemListDOM.firstChild);
  }
  textarea.value = "";
  itemList = [];
});

var reRegExp = /[\\^$.*+?()[\]{}|]/g,
  reHasRegExp = new RegExp(reRegExp.source);

function escapeRegExp(string) {
  return (string && reHasRegExp.test(string)) ?
    string.replace(reRegExp, '\\$&') :
    string;
}

const filterItems = (term) => {
  // /\b(what you're).*?\b/ig
  Array.from(itemListDOM.children).forEach(item => {
    item.innerHTML = item.innerHTML.replace(/(<span class="highlight">|<\/span>)/g, '');
    console.log(item.innerHTML);
  });

  let regexp = new RegExp('\\b(' + escapeRegExp(term) + ')(.*?)\\b', 'ig');
  Array.from(itemListDOM.children)
    .filter((item) => !item.textContent.match(regexp))
    .forEach((item) => item.classList.add('filtered'));

  // highlight
  // Array.from(itemListDOM.children)
  //   .filter((item) => item.textContent.match(regexp))
  //   .forEach((item) => {
  //     item.classList.remove('filtered');
  //     if (term.length >= 1) {
  //       item.innerHTML = item.innerHTML.replace(regexp, "<span class='highlight'>$1</span>$2");
  //     }
  //   });
  Array.from(itemListDOM.children)
    .filter((item) => item.textContent.match(regexp))
    .forEach((item) => {
      item.classList.remove('filtered');
      if (term.length >= 1) {
        let x = item.innerHTML.search(/<div class="spacer">/i);
        console.log(item.innerHTML.substring(0, x));
        let y = item.innerHTML.substring(0, x);
        let z = item.innerHTML.substring(x, item.innerHTML.length)
        // item.innerHTML = item.innerHTML.replace(regexp, "<span class='highlight'>$1</span>$2");
        item.innerHTML = y.replace(regexp, "<span class='highlight'>$1</span>$2") + z;

      }
    });

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