import './popup.css';

(function () {
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
    });
  }

  function setupItemList(raw = []) {
    let listDOM = document.getElementsByClassName('itemlist')[0];
    raw.forEach(res => {
      var elem = document.createElement("li");
      elem.textContent = res.text;
      listDOM.appendChild(elem);
      console.log(res.text);
    });



    document.getElementById('addBtn').addEventListener('click', () => {
      let newText = document.getElementById('newText').value;
      let newUrl = document.getElementById('newUrl').value;
      updateStack({
        type: 'ADD',
        text: newText,
        url: newUrl
      });
      let listDOM = document.getElementsByClassName('itemlist')[0];
      var elem = document.createElement("li");
      elem.textContent = newText;
      listDOM.appendChild(elem);
      clearForm();
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
    document.getElementById('newText').value = "";
    document.getElementById('newUrl').value = "";
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


  // chrome.runtime.onMessage.addListener(getMessage);

  // function getMessage(request, sender, sendResponse) {
  //   console.log(request.greeting);
  // }



  // Communicate with background file by sending a message
  // chrome.runtime.sendMessage({
  //     type: 'GREETINGS',
  //     payload: {
  //       message: 'Hello, my name is Pop. I am from Popup.',
  //     },
  //   },
  //   response => {
  //     console.log(response.message);
  //   }
  // );
})();