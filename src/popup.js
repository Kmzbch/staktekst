import './popup.css';

(function () {




  let addStackSpace = document.getElementById("addStackSpace");
  let addTextArea = document.getElementById("addTextArea");
  let textarea = document.getElementById("addStackText");

  let footer = document.getElementsByTagName("footer")[0];

  footer.addEventListener("click", () => {
    window.scrollBy(0, 300);
    var scrollHeight, totalHeight;
    scrollHeight = document.body.scrollHeight;
    totalHeight = window.scrollY + window.innerHeight;

    if (totalHeight >= scrollHeight) {
      let scrollButton = document.getElementById("scrollButton");
      console.log(scrollButton);
      footer.removeChild(scrollButton);
      let newScrollButton = document.createElement("i");
      newScrollButton.setAttribute("class", "material-icons");
      newScrollButton.innerText = "arrow_upward";
      footer.appendChild(newScrollButton);
      console.log("at the bottom");
    }
  });


  textarea.addEventListener("mouseout", (e) => {
    textarea.style.display = "none";
    addTextArea.style.display = "block";

  });
  textarea.addEventListener("keyup", (e) => {

    console.log("asdfasd");
    // If the user has pressed enter
    if (e.keyCode === 13 + e.shiftKey) {
      let newText = document.getElementById('addStackText').value;

      let newUrl = "";
      updateStack({
        type: 'ADD',
        text: newText,
        url: newUrl
      });
      let listDOM = document.getElementsByClassName('itemlist')[0];
      var elem = document.createElement("li");
      elem.textContent = newText;

      elem.addEventListener("dblclick", () => {
        console.log("!!!")
        var nodes = document.getElementsByTagName('li');
        var parent = document.getElementsByTagName('ul')[0];
        // plus 1
        parent.removeChild(nodes[nodes.length]);
      })

      if (elem.textContent.length > 100) {
        elem.style.fontSize = "15px";
        elem.style.height = "200px !important";
        console.log(elem.style.Height);

      } else {
        elem.style.fontSize = "18px";
        elem.style.height = "60px !important";
      }
      listDOM.appendChild(elem);
      document.getElementById('addStackText').value = "";
      // document.getElementById('addStackText').blur();
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

  function restoreItemList() {
    stackStorage.get(raw => {
      if (typeof raw === "undefined") {
        stackStorage.set(JSON.stringify([]), () => {
          setupItemList([]);
        });
      } else {
        setupItemList(JSON.parse(raw));
      }
      // Create a "close" button and append it to each list item
      var myNodelist = document.getElementsByTagName("li");
      var i;
      for (i = 0; i < myNodelist.length; i++) {
        var span = document.createElement("SPAN");
        span.className = "close";

        let iconDOM = document.createElement("i");
        iconDOM.setAttribute("class", "material-icons");
        iconDOM.innerText = "delete";

        span.appendChild(iconDOM);

        myNodelist[i].appendChild(span);
      }

    });
  }



  function setupItemList(raw = []) {
    let listDOM = document.getElementsByClassName('itemlist')[0];
    raw.forEach(res => {
      var elem = document.createElement("li");
      elem.textContent = res.text;
      elem.addEventListener("dblclick", () => {
        console.log("!!!")
        var nodes = document.getElementsByTagName('li');
        var parent = document.getElementsByTagName('ul')[0];
        // plus 1
        parent.removeChild(nodes[nodes.length - 1]);
      })

      if (elem.textContent.length > 100) {
        elem.style.fontSize = "15px";
        elem.style.height = "200px !important";
        console.log(elem.style.Height);

      } else {
        elem.style.fontSize = "18px";
        elem.style.height = "60px !important";
      }

      listDOM.appendChild(elem);
      console.log(res.text);
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
      updateStack({
        type: 'RESET'
      });
      let listDOM = document.getElementsByClassName('itemlist')[0];
      while (listDOM.firstChild) {
        listDOM.removeChild(listDOM.firstChild);
      }
      clearForm();
    });
  }

  function clearForm() {
    document.getElementById('addStackText').value = "";
    document.getElementById('addStackText').value = document.getElementById('addStackText').value.replace(/^(\r\n)|(\n)/, '');
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


  //
  document.addEventListener('DOMContentLoaded', restoreItemList);
})();