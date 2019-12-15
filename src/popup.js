import './popup.css';

const addStackSpace = document.getElementById("addStackSpace");
const addTextArea = document.getElementById("addTextArea");
const textarea = document.getElementById("addStackText");
const footer = document.getElementsByTagName("footer")[0];
const resetBtn = document.getElementById('resetBtn');
const list = document.getElementsByClassName('itemlist')[0];

(function () {
  // initialize eventListeners
  textarea.addEventListener("mouseout", (e) => {
    textarea.style.display = "none";
    addTextArea.style.display = "block";
  });

  textarea.addEventListener("keyup", (e) => {
    // If the user has pressed enter
    if (e.keyCode === 13 + e.shiftKey) {
      let newText = textarea.value;
      let newUrl = "";
      updateStack({
        type: 'ADD',
        text: newText,
        url: newUrl
      });
      var elem = document.createElement("li");
      elem.textContent = newText;
      list.appendChild(elem);
      textarea.value = "";
      return false;
    } else {
      return true;
    }
  });

  textarea.addEventListener("blur", () => {
    setTimeout(() => {
      console.log("blur!!");
      textarea.style.display = "none";
      addTextArea.style.display = "block";
    }, 1000);
  });

  addTextArea.addEventListener("click", () => {
    textarea.style.display = "block";
    addTextArea.style.display = "none";
  });

  //
  document.addEventListener('DOMContentLoaded', restoreItemList);

})();


function restoreItemList() {
  stackStorage.get(raw => {
    if (typeof raw === "undefined") {
      stackStorage.set(JSON.stringify([]), () => {
        setupItemList([]);
      });
    } else {
      setupItemList(JSON.parse(raw));
    }
  });
}

function setupItemList(raw = []) {
  raw.forEach(res => {
    var elem = document.createElement("li");
    elem.textContent = res.text;
    list.appendChild(elem);
    console.log(res.text);
  });

  resetBtn.addEventListener('click', () => {
    updateStack({
      type: 'RESET'
    });
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }
    clearForm();
  });
}


const stackStorage = {
  get: callback => {
    chrome.storage.sync.get(['raw'], result => {
      callback(result.raw);
    });
  },
  set: (value, callback) => {
    chrome.storage.sync.set({
        raw: value,
      },
      () => {
        callback();
      });
  }
};


function clearForm() {
  textarea.value = "";
}

function updateStack({
  type,
  text = "",
  url = ""
}) {
  if (type === 'RESET') {
    stackStorage.set("[]", () => {
      console.log("Reset!");
    });
  } else {
    stackStorage.get(raw => {
      // read from storage
      let itemlist = [];
      let newItem = {
        text: text,
        url: url
      };
      if (raw !== undefined) {
        itemlist = JSON.parse(raw);
        console.log(itemlist);
      }
      itemlist.push(newItem);
      stackStorage.set(JSON.stringify(itemlist), () => {
        console.log("Added: " + newItem.text + '&' + newItem.url);
      });
    });
  }
};