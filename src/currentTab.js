// prepare for getting messages from background.js
chrome.runtime.onMessage.addListener(getMessage);

// https://qiita.com/zaru/items/1571942bc91e31d43431
import './currentTab.css';

// document.addEventListener("selectchange", function (event) {
//     console.log("Fired! A");
//     var dom = document.getElementById("stackButton");
//     let selection = document.getSelection();
//     if (selection.toString() === "") {
//         document.body.removeChild(dom);
//     } else if (dom != null) {
//         document.body.removeChild(dom);
//     }
// });

// document.addEventListener("mouseup", function (event) {
//     setTimeout(() => {
//         console.log("Fired! B");
//         var dom = document.getElementById("stackButton");
//         let selection = document.getSelection();
//         if (dom != null) {
//             if (selection.toString() === "") {
//                 //            document.body.removeChild(dom);
//             } else {

//                 var bcr = selection.getRangeAt(0).getBoundingClientRect();
//                 var button = null;
//                 var button = document.createElement("button");
//                 button.setAttribute("id", "stackButton");
//                 button.setAttribute("class", "bubble");

//                 button.style.top = bcr.top + 'px';
//                 //                button.style.left = Math.max(5, Math.floor((bcr.left + bcr.right) / 2) - 100) + 'px';
//                 button.style.left = bcr.left + 'px';
//                 button.style.width = bcr.width + 10 + "px";
//                 button.style.height = bcr.height + "px";

//                 // button.style.top = bcr.top + bcr.height - 20 + 'px';
//                 // button.style.left = bcr.left + bcr.width + 'px';
//                 // button.style.width = 20 + 'px';
//                 // button.style.height = 20 + 'px';
//                 // button.style.top = bcr.top + bcr.height + 'px';
//                 // button.style.left = bcr.left + 'px';
//                 // button.style.width = bcr.width + 'px';
//                 // button.style.height = 20 + 'px';

//                 console.log(bcr);


//                 button.innerText = "+";
//                 button.style.zIndex = 1;
//                 button.style.display = 'block';
//                 console.log("1");
//                 setTimeout(() => {
//                     document.body.appendChild(button);
//                 }, 50);
//             }

//             document.body.removeChild(dom);
//         } else {
//             if (selection.toString() !== "") {
//                 //addDOM
//                 var bcr = selection.getRangeAt(0).getBoundingClientRect();
//                 var button = null;
//                 console.log(bcr);
//                 var button = document.createElement("button");
//                 button.setAttribute("id", "stackButton");
//                 button.setAttribute("class", "bubble");

//                 button.style.top = bcr.top + 'px';
//                 //                button.style.left = Math.max(5, Math.floor((bcr.left + bcr.right) / 2) - 100) + 'px';
//                 button.style.left = bcr.left + 'px';
//                 button.style.width = bcr.width + 10 + "px";
//                 button.style.height = bcr.height + "px";
//                 // button.style.top = bcr.top + bcr.height - 20 + 'px';
//                 // button.style.left = bcr.left + bcr.width + 'px';
//                 // button.style.width = 20 + 'px';
//                 // button.style.height = 20 + 'px';
//                 // button.style.top = bcr.top + bcr.height + 'px';
//                 // button.style.left = bcr.left + 'px';
//                 // button.style.width = bcr.width + 'px';
//                 // button.style.height = 20 + 'px';

//                 button.innerText = "+";
//                 button.style.zIndex = 1;
//                 button.style.display = 'block';
//                 console.log("2");
//                 setTimeout(() => {
//                     document.body.appendChild(button);
//                 }, 50);

//             }
//         }

//     }, 10);
// });

function getMessage(request, sender, sendResponse) {
    //    console.log(request.message);
    sendResponse({
        selection: window.getSelection().toString()
    });
}