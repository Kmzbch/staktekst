import './currentTab.css';

function getMessage(request, sender, sendResponse) {
    //    console.log(request.message);
    sendResponse({
        selection: window.getSelection().toString()
    });
}

function renderStackBubble(event) {
    setTimeout(() => {
        let sel = document.getSelection();
        if (sel.toString() === "") {
            bubble.style.display = "none";
        } else {
            let bcr = sel.getRangeAt(0).getBoundingClientRect();
            //            bubble.style.top = bcr.top - 45 + window.scrollY + 'px';
            bubble.style.top = bcr.top - 75 + window.scrollY + 'px';
            // bubbleDOM.style.left = Math.max(5, Math.floor((bcr.left + bcr.right) / 2) - 100) + window.scrollX + 'px';
            bubble.style.left = Math.max(5, Math.floor((bcr.left + bcr.right) / 2) - 50) + window.scrollX + 'px';
            bubble.style.display = "flex";
        }
    }, 100)
}

function createBubbleDOM() {

    let bubbleDOM = document.createElement("div");
    bubbleDOM.setAttribute("id", "stackBubble");
    bubbleDOM.setAttribute("class", "bubble");

    let searchEngineDiv = document.createElement("div");
    searchEngineDiv.setAttribute("id", "searchEngineDiv");
    bubbleDOM.appendChild(searchEngineDiv);

    let systemCommandDiv = document.createElement("div");
    systemCommandDiv.setAttribute("id", "systemCommandDiv");
    bubbleDOM.appendChild(systemCommandDiv);

    let icon1 = document.createElement("i");
    icon1.setAttribute("class", "material-icons stackButton");
    icon1.setAttribute("title", "Google画像検索");
    icon1.innerText = "search";
    icon1.addEventListener("mousedown", () => {
        chrome.runtime.sendMessage({
            command: 'google',
            selection: window.getSelection().toString()
        });

    });

    let icon2 = document.createElement("i");
    icon2.setAttribute("class", "material-icons stackButton");
    icon2.setAttribute("title", "Vocabulary.com単語検索");
    icon2.innerText = "check";
    icon2.addEventListener("mousedown", () => {
        chrome.runtime.sendMessage({
            command: 'vocabulary',
            selection: window.getSelection().toString()
        });

    });

    let icon3 = document.createElement("i");
    icon3.setAttribute("class", "fas fa-user-friends stackButton");
    icon3.setAttribute("title", "Do People Say It");
    icon3.addEventListener("mousedown", () => {
        console.log("Bubble clicked: " + window.getSelection().toString());
        chrome.runtime.sendMessage({
            command: 'dopeoplesayit',
            selection: window.getSelection().toString()
        });
    });

    let icon4 = document.createElement("i");
    icon4.setAttribute("class", "fas fa-book fa-lg stackButton");
    icon4.setAttribute("title", "SKELL");
    icon4.addEventListener("mousedown", () => {
        chrome.runtime.sendMessage({
            command: 'wordsketch',
            selection: window.getSelection().toString()
        });
    });

    let icon5 = document.createElement("i");
    icon5.setAttribute("class", "fab fa-twitter fa-lg stackButton");
    icon5.setAttribute("title", "Twitter検索");
    icon5.addEventListener("mousedown", () => {
        chrome.runtime.sendMessage({
            command: 'twitter',
            selection: window.getSelection().toString()
        });
    });

    let icon6 = document.createElement("i");
    icon6.setAttribute("class", "fab fa-youtube fa-lg stackButton");
    icon6.setAttribute("title", "Youglish検索");
    icon6.addEventListener("mousedown", () => {
        chrome.runtime.sendMessage({
            command: 'youglish',
            selection: window.getSelection().toString()
        });
    });

    let icon7 = document.createElement("i");
    icon7.setAttribute("class", "material-icons stackButton");
    icon7.setAttribute("title", "みらい翻訳で英→日翻訳");
    icon7.innerText = "translate";
    icon7.addEventListener("mousedown", () => {
        console.log("Bubble clicked: " + window.getSelection().toString());
        chrome.runtime.sendMessage({
            command: 'mirai',
            selection: window.getSelection().toString()
        });
    });

    let icon8 = document.createElement("i");
    icon8.setAttribute("class", "material-icons stackButton");
    icon8.setAttribute("title", "テキストを読み上げ");
    icon8.innerText = "message";
    icon8.addEventListener("mousedown", () => {
        chrome.runtime.sendMessage({
            command: 'odd',
            selection: window.getSelection().toString()
        });
    });

    let icon9 = document.createElement("i");
    icon9.setAttribute("class", "material-icons stackButton");
    icon9.setAttribute("title", "URL付きコピー");
    icon9.innerText = "assignment";
    icon9.addEventListener("mousedown", () => {
        bubble.style.transform = "scale(0.95)";
        setTimeout(() => {
            bubble.style.transform = "scale(1)";
        }, 100);
        chrome.runtime.sendMessage({
            command: 'extendedcopy',
            selection: window.getSelection().toString()
        });
    });

    let icon10 = document.createElement("i");
    icon10.setAttribute("class", "material-icons stackButton");
    icon10.setAttribute("title", "テキストをプッシュ");
    icon10.innerText = "input";
    icon10.addEventListener("mousedown", () => {
        console.log(window.getSelection().toString());
        bubble.style.transform = "scale(0.95)";
        setTimeout(() => {
            bubble.style.transform = "scale(1)";
        }, 100);

        chrome.runtime.sendMessage({
            command: 'pushtext',
            selection: window.getSelection().toString()
        });

    });

    bubbleDOM.appendChild(icon1);
    bubbleDOM.appendChild(icon2);
    bubbleDOM.appendChild(icon3);
    bubbleDOM.appendChild(icon4);
    bubbleDOM.appendChild(icon5);
    bubbleDOM.appendChild(icon6);
    bubbleDOM.appendChild(icon7);
    bubbleDOM.appendChild(icon8);
    bubbleDOM.appendChild(icon9);
    bubbleDOM.appendChild(icon10);

    searchEngineDiv.appendChild(icon1);
    searchEngineDiv.appendChild(icon2);
    searchEngineDiv.appendChild(icon3);
    searchEngineDiv.appendChild(icon4);
    searchEngineDiv.appendChild(icon5);
    searchEngineDiv.appendChild(icon6);
    searchEngineDiv.appendChild(icon7);
    searchEngineDiv.appendChild(icon8);

    systemCommandDiv.appendChild(icon9);
    systemCommandDiv.appendChild(icon10);



    return bubbleDOM;
}

const bubble = createBubbleDOM();
document.body.appendChild(bubble);

chrome.runtime.onMessage.addListener(getMessage);
document.addEventListener("mouseup", renderStackBubble);