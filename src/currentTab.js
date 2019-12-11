import './currentTab.css';

chrome.runtime.onMessage.addListener(getMessage);

function getMessage(request, sender, sendResponse) {
    //    console.log(request.message);
    sendResponse({
        selection: window.getSelection().toString()
    });
}




document.addEventListener("selectchange", function (event) {
    let bubble = document.getElementById("stackBubble");
    setTimeout(() => {
        document.body.removeChild(bubble);
    }, 10)
});

document.addEventListener("mouseup", function (event) {
    let bubble = document.getElementById("stackBubble");
    if (bubble != null) {
        setTimeout(() => {
            document.body.removeChild(bubble);
        }, 10)
    }
    let sel = document.getSelection();
    if (sel.toString() !== "") {
        document.body.appendChild(createBubbleDOM());
    }
});

function createBubbleDOM() {
    let sel = document.getSelection();
    let bcr = sel.getRangeAt(0).getBoundingClientRect();

    let bubbleDOM = document.createElement("div");

    bubbleDOM.setAttribute("id", "stackBubble");
    bubbleDOM.setAttribute("class", "bubble");
    bubbleDOM.style.top = bcr.top - 45 + window.scrollY + 'px';
    // bubbleDOM.style.left = Math.max(5, Math.floor((bcr.left + bcr.right) / 2) - 100) + window.scrollX + 'px';
    bubbleDOM.style.left = Math.max(5, Math.floor((bcr.left + bcr.right) / 2) - 50) + window.scrollX + 'px';

    let icon1 = document.createElement("i");
    icon1.setAttribute("class", "material-icons stackButton");
    icon1.setAttribute("title", "検索");
    icon1.innerText = "search";

    icon1.addEventListener("click", () => {
        console.log("clicked");
        // chrome.runtime.sendMessage({
        //     selection: sel.toString(),
        //     },
        //     response => {
        //         console.log(response.message);
        //     }
        // );
    });


    let icon2 = document.createElement("i");
    icon2.setAttribute("class", "material-icons stackButton");
    icon2.setAttribute("title", "英→日翻訳");
    icon2.innerText = "translate";

    let icon3 = document.createElement("i");
    icon3.setAttribute("class", "material-icons stackButton");
    icon3.setAttribute("title", "テキストを読み上げ");
    icon3.innerText = "message";

    let icon4 = document.createElement("i");
    icon4.setAttribute("class", "material-icons stackButton");
    icon4.setAttribute("title", "URL付きコピー");
    icon4.innerText = "assignment_turned_in";

    let icon5 = document.createElement("i");
    icon5.setAttribute("class", "material-icons stackButton");
    icon5.setAttribute("title", "テキストをプッシュ");
    icon5.innerText = "input";

    bubbleDOM.appendChild(icon1);
    bubbleDOM.appendChild(icon2);
    bubbleDOM.appendChild(icon3);
    bubbleDOM.appendChild(icon4);
    bubbleDOM.appendChild(icon5);

    return bubbleDOM;
}