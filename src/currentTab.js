import './currentTab.css';

chrome.runtime.onMessage.addListener(getMessage);

function getMessage(request, sender, sendResponse) {
    //    console.log(request.message);
    sendResponse({
        selection: window.getSelection().toString()
    });
}


document.body.appendChild(createBubbleDOM());



const bubble = document.getElementById("stackBubble");


document.addEventListener("mouseup", function (event) {
    setTimeout(() => {
        let sel = document.getSelection();
        if (sel.toString() === "") {
            bubble.style.display = "none";
        } else {
            let bcr = sel.getRangeAt(0).getBoundingClientRect();

            bubble.style.top = bcr.top - 45 + window.scrollY + 'px';
            // bubbleDOM.style.left = Math.max(5, Math.floor((bcr.left + bcr.right) / 2) - 100) + window.scrollX + 'px';
            bubble.style.left = Math.max(5, Math.floor((bcr.left + bcr.right) / 2) - 50) + window.scrollX + 'px';

            bubble.style.display = "flex";
        }

    }, 100)
});


function createBubbleDOM() {

    let bubbleDOM = document.createElement("div");
    bubbleDOM.setAttribute("id", "stackBubble");
    bubbleDOM.setAttribute("class", "bubble");

    let icon1 = document.createElement("i");
    icon1.setAttribute("class", "material-icons stackButton");
    icon1.setAttribute("title", "検索");
    icon1.innerText = "search";
    icon1.addEventListener("mousedown", () => {
        chrome.runtime.sendMessage({
            command: 'vocabulary',
            selection: window.getSelection().toString()
        }, response => {});

    });


    let icon2 = document.createElement("i");
    icon2.setAttribute("class", "material-icons stackButton");
    icon2.setAttribute("title", "英→日翻訳");
    icon2.innerText = "translate";
    icon2.addEventListener("mousedown", () => {
        console.log("Bubble clicked: " + window.getSelection().toString());
        chrome.runtime.sendMessage({
            command: 'mirai',
            selection: window.getSelection().toString()
        }, response => {});
    });


    let icon3 = document.createElement("i");
    icon3.setAttribute("class", "material-icons stackButton");
    icon3.setAttribute("title", "テキストを読み上げ");
    icon3.innerText = "message";
    icon3.addEventListener("mousedown", () => {
        chrome.runtime.sendMessage({
            command: 'odd',
            selection: window.getSelection().toString()
        }, response => {});
    });


    let icon4 = document.createElement("i");
    icon4.setAttribute("class", "material-icons stackButton");
    icon4.setAttribute("title", "URL付きコピー");
    icon4.innerText = "assignment_turned_in";
    icon4.addEventListener("mousedown", () => {
        chrome.runtime.sendMessage({
            command: 'extendedcopy',
            selection: window.getSelection().toString()
        }, response => {});
    });


    let icon5 = document.createElement("i");
    icon5.setAttribute("class", "material-icons stackButton");
    icon5.setAttribute("title", "テキストをプッシュ");
    icon5.innerText = "input";
    icon5.addEventListener("mousedown", () => {
        chrome.runtime.sendMessage({
            command: 'pushtext',
            selection: window.getSelection().toString()
        }, response => {});
    });

    bubbleDOM.appendChild(icon1);
    bubbleDOM.appendChild(icon2);
    bubbleDOM.appendChild(icon3);
    bubbleDOM.appendChild(icon4);
    bubbleDOM.appendChild(icon5);

    return bubbleDOM;
}