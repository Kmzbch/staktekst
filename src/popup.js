import './popup.css';

(function () {
  const textStorage = {
    get: callback => {
      chrome.storage.sync.get(['text'], result => {
        callback(result.text);
      });
    },
    set: (value, callback) => {
      chrome.storage.sync.set({
          text: value,
        },
        () => {
          callback();
        });
    }
  };

  function restoreTextFeature() {
    textStorage.get(text => {
      if (typeof text === 'undefined') {
        textStorage.set("", () => {
          setupTextFeature("");
        });
      } else {
        setupTextFeature(text);
      }
    });
  }

  function setupTextFeature(text = "") {
    document.getElementById('addBtn').addEventListener('click', () => {
      let newText = document.getElementById('newText').value;
      console.log("Adding:" + newText);
      updateText({
        type: 'ADD',
        text: newText
      });
      document.getElementById('newText').value = "";
    });
    document.getElementById('resetBtn').addEventListener('click', () => {
      console.log("RESET");
      updateText({
        type: 'RESET'
      });
      document.getElementById('newText').value = "";
    });
  }

  function updateText({
    type,
    text = ""
  }) {
    console.log("type: " + type);
    console.log("text: " + text);
    if (type === 'RESET') {
      textStorage.set("", () => {
        console.log("Reset!!!");
      });
    } else {
      textStorage.get(storedText => {
        console.log("text: " + storedText);
        let newText = storedText + "+" + text;
        textStorage.set(newText, () => {
          console.log("Added: " + newText);


          // chrome.tabs.query({
          //   active: true,
          //   currentWindow: true
          // }, tabs => {
          //   const tab = tabs[0];

          //   chrome.tabs.sendMessage(
          //     tab.id, {
          //       type: 'COUNT',
          //       payload: {
          //         count: newCount,
          //       },
          //     },
          //     response => {
          //       console.log('Current count value passed to contentScript file');
          //     }
          //   );
          // });
        });
      });
    }
  };

  // loaded
  document.addEventListener('DOMContentLoaded', restoreTextFeature);

  // Communicate with background file by sending a message
  chrome.runtime.sendMessage({
      type: 'GREETINGS',
      payload: {
        message: 'Hello, my name is Pop. I am from Popup.',
      },
    },
    response => {
      console.log(response.message);
    }
  );
})();