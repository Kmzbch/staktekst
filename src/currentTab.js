// prepare for getting messages from background.js
chrome.runtime.onMessage.addListener(getMessage);

import './currentTab.css';

// // 選択範囲イベント
// document.addEventListener("selectionchange", function (event) {
//     let selection = document.getSelection();
//     var dom = document.getElementById("stackButton");

//     if (dom != null) {
//         document.body.removeChild(dom);
//     }

//     if (selection.toString() !== "") {
//         var bcr = selection.getRangeAt(0).getBoundingClientRect();
//         var button = null;
//         console.log(bcr);
//         var button = document.createElement("button");
//         button.setAttribute("id", "stackButton");
//         button.setAttribute("class", "bubble");
//         button.style.top = bcr.bottom + 'px';
//         button.style.left = Math.max(5, Math.floor((bcr.left + bcr.right) / 2) - 100) + 'px';
//         button.innerText = "!!!";
//         button.style.zIndex = 1;
//         button.style.display = 'block';
//         document.body.appendChild(button);
//     } else {
//     }
//     // console.log("LEFT:" + selection.getRangeAt(0).commonAncestorContainer.offsetLeft);
// });

function getMessage(request, sender, sendResponse) {
    //    console.log(request.message);
    sendResponse({
        selection: window.getSelection().toString()
    });
}