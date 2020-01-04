'use strict';

import './currentTab.css';

const SEARCH_ENGINE_ICONS = [{
        className: "material-icons stackButton",
        title: "Google画像検索",
        innerText: "image_search",
        command: "google",
    }, {
        className: "material-icons stackButton",
        title: "Vocabulary.comで単語検索",
        innerText: "check",
        command: "vocabulary",
    }, {
        // className: "fas fa-user-friends stackButton",
        className: "material-icons stackButton",
        title: "Do People Say Itでフレーズ検索",
        innerText: "people",
        command: "dopeoplesayit",
    },
    {
        className: "fas fa-book fa-lg stackButton",
        title: "Urban Dictionaryで単語検索",
        command: "urban",
    }, {
        // className: "fab fa-twitter fa-lg stackButton",
        // title: "Twitterでツイート検索",
        // command: "twitter",

        // className: "material-icons stackButton",
        className: "fab fa-twitter fa-lg stackButton",
        title: 'Netspeakでフレーズ検索',
        command: 'netspeak'
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
        title: "Oddcastでテキストを読み上げ",
        innerText: "message",
        command: "oddcast",
    }
]

const SYSTEM_COMMAND_ICONS = [{
    className: "material-icons stackButton",
    title: "URLとタイトル付きでコピー",
    innerText: "assignment",
    command: "extendedcopy",
}, {
    className: "material-icons stackButton",
    title: "テキストをスタックにプッシュ",
    innerText: "input",
    command: "pushtext",
}]

const FLOAT_COMMAND_ICONS = [{
    className: "material-icons bookmark-icon",
    title: "ページをスタックにブックマーク",
    innerText: "bookmarks",
    command: "bookmark",
}, {
    className: "material-icons zoom-icon",
    title: "ページを拡大",
    innerText: "zoom_in",
    command: "zoomtofit",

}]

/* DOM creation and manipulation */
const createIconDOM = ({
    className,
    title,
    innerText = '',
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
    bubbleDOM.setAttribute('id', 'bubble');
    bubbleDOM.classList.add('hidden');

    let leftContainer = document.createElement('div');
    let rightContainer = document.createElement('div');

    leftContainer.setAttribute('id', 'leftContainer');
    rightContainer.setAttribute('id', 'rightContainer');

    // append icons on the bubble left
    SEARCH_ENGINE_ICONS.forEach(icon => {
        leftContainer.appendChild(createIconDOM(icon));
    });

    // append icons on the bubble right
    SYSTEM_COMMAND_ICONS.forEach(icon => {
        if (icon.command === 'pushtext') {
            // remove pushtext icon when on popup.html
            if (!document.URL.includes('chrome-extension://')) {
                rightContainer.appendChild(createIconDOM(icon));
            }
        } else {
            rightContainer.appendChild(createIconDOM(icon));
        }
    });

    bubbleDOM.appendChild(leftContainer);
    bubbleDOM.appendChild(rightContainer);

    // append icons on the float container
    let floatContainer = document.createElement('div');
    floatContainer.setAttribute('id', 'float-container');

    FLOAT_COMMAND_ICONS.forEach(icon => {
        floatContainer.appendChild(createIconDOM(icon))
    });

    bubbleDOM.appendChild(floatContainer);

    return bubbleDOM;
}

const renderBubble = () => {
    setTimeout(() => {
        let selection = document.getSelection();

        if (selection.toString() === '') {
            bubble.classList.add('hidden');
        } else {
            bubble.classList.remove('hidden');

            // switch zoom icon
            chrome.runtime.sendMessage({
                command: 'GET_ZOOMFACTOR'
            }, response => {
                if (response.zoomFactor === 1) {
                    bubble.querySelector('.zoom-icon').innerText = 'zoom_in'
                    bubble.querySelector('.zoom-icon').title = 'ページを拡大'

                } else {
                    bubble.querySelector('.zoom-icon').innerText = 'zoom_out'
                    bubble.querySelector('.zoom-icon').title = 'ページ倍率をリセット'
                }
            });

            // set the bubble position based on selection
            let boundingCR = selection.getRangeAt(0).getBoundingClientRect();
            bubble.style.top = (boundingCR.top - 80) + window.scrollY + 'px';
            bubble.style.left = Math.floor((boundingCR.left + boundingCR.right) / 2) - 50 + window.scrollX + 'px';
        }
    }, 30)
}

const hideBubble = () => {
    if (getComputedStyle(bubble).display !== 'none') {
        bubble.classList.add('hidden');
    }
}

const bubble = (() => {
    let elem = document.querySelector('#bubble');
    if (!elem) {
        elem = createBubbleDOM();
        document.body.appendChild(elem);
    }
    return elem;
})();

const sendCommandMessage = (command) => {
    let text = document.getSelection().toString();

    // only for popup.html
    if (document.URL.includes('chrome-extension://')) {
        text = text.replace(/check\s$/, '');

        // get url and title from footnote
        let textitem = window.getSelection().getRangeAt(0).commonAncestorContainer.parentElement;
        // let aTag = textitem.classList.contains('clip') ? textitem.querySelector('a') : null;
        // let url = aTag ? aTag.href : '';
        // let title = aTag ? aTag.innerText : '';

    }

    chrome.runtime.sendMessage({
        command: command,
        selection: text
    });
}

// attach bubble to the loaded page
document.addEventListener('mouseup', renderBubble)

export {
    hideBubble
}