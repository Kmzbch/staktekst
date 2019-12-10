import './currentTab.css';

chrome.runtime.onMessage.addListener(getMessage);

function getMessage(request, sender, sendResponse) {
    //    console.log(request.message);
    sendResponse({
        selection: window.getSelection().toString()
    });
}

// document.addEventListener("selectchange", function (event) {
//     let bubble = document.getElementById("stackBubble");
//     document.body.removeChild(bubble);
// });

// document.addEventListener("mouseup", function (event) {
//     let bubble = document.getElementById("stackBubble");
//     if (bubble != null) {
//         document.body.removeChild(bubble);
//     }
//     let sel = document.getSelection();
//     if (sel.toString() !== "") {
//         document.body.appendChild(createBubbleDOM());
//     }
// });

function createBubbleDOM() {
    let sel = document.getSelection();
    var bcr = sel.getRangeAt(0).getBoundingClientRect();

    var bubbleDOM = document.createElement("div");

    bubbleDOM.setAttribute("id", "stackBubble");
    bubbleDOM.setAttribute("class", "bubble");
    bubbleDOM.style.top = bcr.top - 45 + window.scrollY + 'px';
    bubbleDOM.style.left = Math.max(5, Math.floor((bcr.left + bcr.right) / 2) - 75) + window.scrollX + 'px';

    var ul = document.createElement("ul");
    ul.style.display = "flex";
    ul.style.flexDirection = "row";
    var li1 = document.createElement("li");
    li1.style.flex = "1";
    li1.style.listStyle = "none";
    var icon1 = document.createElement("i");
    icon1.setAttribute("class", "material-icons");
    icon1.innerText = "search";
    li1.appendChild(icon1);

    var li2 = document.createElement("li");
    li2.style.flex = "1";
    li2.style.listStyle = "none";

    var icon2 = document.createElement("i");
    icon2.setAttribute("class", "material-icons");
    icon2.innerText = "g_translate";
    li2.appendChild(icon2);

    var li3 = document.createElement("li");
    li3.style.flex = "1";
    li3.style.listStyle = "none";

    var icon3 = document.createElement("i");
    icon3.setAttribute("class", "material-icons");
    icon3.innerText = "input";
    li3.appendChild(icon3);

    ul.appendChild(li1);
    ul.appendChild(li2);
    ul.appendChild(li3);

    bubbleDOM.appendChild(ul);

    return bubbleDOM;
}