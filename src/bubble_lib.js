// import IconPreset from './IconPreset.js';
const SEARCH_ENGINE_ICONS = [{
        className: "material-icons stackButton",
        title: "Google画像検索",
        innerText: "image_search",
        command: "google",
    }, {
        className: "material-icons stackButton",
        title: "Vocabulary.com単語検索",
        innerText: "check",
        command: "vocabulary",
    }, {
        className: "fas fa-user-friends stackButton",
        title: "Do People Say It",
        command: "dopeoplesayit",
    },
    {
        className: "fas fa-book fa-lg stackButton",
        title: "Urban Dictionary",
        command: "urban",
    }, {
        className: "fab fa-twitter fa-lg stackButton",
        title: "Twitter検索",
        command: "twitter",
    },
    {
        className: "fab fa-youtube fa-lg stackButton",
        title: "Youglish検索",
        command: "youglish",
    }, {
        className: "material-icons stackButton",
        title: "みらい翻訳で英→日翻訳",
        innerText: "translate",
        command: "mirai",
    }, {
        className: "material-icons stackButton",
        title: "テキストを読み上げ",
        innerText: "message",
        command: "odd",
    }
]

const SYSTEM_COMMAND_ICONS = [{
    className: "material-icons stackButton",
    title: "URL付きコピー",
    innerText: "assignment",
    command: "extendedcopy",
}, {
    className: "material-icons stackButton",
    title: "テキストをプッシュ",
    innerText: "input",
    command: "pushtext",
}]

const EXTRA_COMMAND_ICONS = [{
    className: "material-icons bookmark-icon",
    title: "ページURLをスタックに追加",
    innerText: "bookmarks",
    command: "bookmark",
}]

/* DOM creation and manipulation */
const createIconDOM = ({
    className,
    title,
    innerText = "",
    command
}) => {
    let iconDOM = document.createElement('i');

    iconDOM.setAttribute('class', className);
    iconDOM.setAttribute('title', title);
    iconDOM.innerText = innerText;

    iconDOM.addEventListener('mousedown', () => {
        sendCommandMessage(command);
        // remove selection and bubble
        document.getSelection().removeAllRanges();
        renderBubble();
    });

    return iconDOM;
}

const createBubbleDOM = () => {

    let bubbleDOM = document.createElement('div');
    let leftContainer = document.createElement('div');
    let rightContainer = document.createElement('div');

    bubbleDOM.setAttribute('id', 'bubble');
    leftContainer.setAttribute('id', 'leftContainer');
    rightContainer.setAttribute('id', 'rightContainer');

    SEARCH_ENGINE_ICONS.forEach(icon => {
        leftContainer.appendChild(createIconDOM(icon));
    });
    SYSTEM_COMMAND_ICONS.forEach(icon => {
        rightContainer.appendChild(createIconDOM(icon));
    });

    bubbleDOM.appendChild(leftContainer);
    bubbleDOM.appendChild(rightContainer);

    // addbookmark
    let outsideContainer = document.createElement('div');
    outsideContainer.setAttribute('id', 'outside-container');
    // outsideContainer.innerHTML = '<i class="material-icons bookmark-icon">bookmarks</i>';

    EXTRA_COMMAND_ICONS.forEach(icon => {
        outsideContainer.appendChild(createIconDOM(icon))
    });
    bubbleDOM.appendChild(outsideContainer);

    return bubbleDOM;
}

const renderBubble = () => {
    setTimeout(() => {
        let selection = document.getSelection();

        if (selection.toString() === '') {
            bubble.style.display = 'none';
        } else {
            bubble.style.display = 'flex';

            let boundingCR = selection.getRangeAt(0).getBoundingClientRect();
            bubble.style.top = (boundingCR.top - 80) + window.scrollY + 'px';
            bubble.style.left = Math.floor((boundingCR.left + boundingCR.right) / 2) - 50 + window.scrollX + 'px';
        }
    }, 30)
}

const bubble = (() => {
    let elem = document.querySelector('#bubble');
    if (elem == null) {
        elem = createBubbleDOM();
        document.body.appendChild(elem);
    }
    return elem;
})();

// should have separate sendMessage on each of currentTab.js and popup.js
// workaround for now
function sendCommandMessage(command) {
    let text = document.getSelection().toString();

    if (document.URL.includes('chrome-extension://')) {
        text = text.replace(/check\s$/, "");

        // get url and title from footnote
        let textitem = window.getSelection().getRangeAt(0).commonAncestorContainer.parentElement;
        let aTag, url, title;

        if (textitem.classList.contains('clip')) {
            aTag = textitem.querySelector('a');
            url = aTag.href;
            title = aTag.innerText || null;
        } else {
            url = "";
            title = "";
        }
    }
    chrome.runtime.sendMessage({
        command: command,
        selection: text
    });
}

export {
    createIconDOM,
    createBubbleDOM,
    renderBubble,
    bubble,
    sendCommandMessage
}