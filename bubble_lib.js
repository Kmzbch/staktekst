'use strict';

const SEARCH_ENGINE_ICONS = [{
    className: "material-icons stackButton",
    title: "Google検索",
    innerText: "search",
    command: "google",
}, {
    className: "material-icons stackButton",
    title: "Vocabulary.comで単語を検索",
    innerText: "check",
    command: "vocabulary",
}, {
    // className: "fas fa-user-friends stackButton",
    className: "material-icons stackButton",
    title: "Do People Say Itでフレーズを検索",
    innerText: "people",
    command: "dopeoplesayit",
},
{
    // className: "fas fa-book fa-lg stackButton",
    // title: "Urban Dictionaryで単語を検索",
    // command: "urban",
    className: "fas fa-book fa-lg stackButton",
    title: "SKELLで例文を検索",
    command: "skell",

}, {
    // className: "fab fa-twitter fa-lg stackButton",
    // title: "Twitterでツイート検索",
    // command: "twitter",

    // className: "material-icons stackButton",
    className: "fab fa-twitter fa-lg stackButton",
    title: 'Netspeakでフレーズを検索',
    command: 'netspeak'
},
{
    className: "fab fa-youtube fa-lg stackButton",
    title: "Youglishで発音を検索",
    command: "youglish",
}, {
    className: "material-icons stackButton",
    title: "みらい翻訳で英→日翻訳",
    innerText: "translate",
    command: "mirai",
}, {
    className: "material-icons stackButton",
    title: "Oddcastでテキストを読み上げ",
    innerText: "play_arrow",
    command: "oddcast",
}
]

const SYSTEM_COMMAND_ICONS = [
    {
        className: "material-icons stackButton",
        title: "テキストをスタックにプッシュ",
        innerText: "input",
        command: "pushtext",
    },
    {
        className: "material-icons stackButton",
        title: "URLとタイトル付きでコピー",
        innerText: "assignment",
        command: "extendedcopy",
    }]

const FLOAT_COMMAND_ICONS = [{
    className: "material-icons bookmark-icon",
    title: "ページをスタックにブックマーク",
    innerText: "bookmarks",
    command: "bookmark",
}, {
    className: "material-icons zoom-icon",
    title: "ページを拡大",
    innerText: "switchzoom",
    command: "switchzoom",

}]

/* DOM creation and manipulation */
const createIconDOM = ({
    className,
    title,
    innerText = '',
    command
}) => {
    return $('<i>', {
        addClass: className,
        title: title,
        text: innerText,
        on: {
            mousedown: () => {
                sendCommandMessage(command);
                window.getSelection().removeAllRanges();
                renderBubble();
            }
        }
    });
}

const createBubbleDOM = () => {

    let bubble = $('<div id="bubble" class="hidden"></div>')
        .append($('<div id="leftContainer"></div>'))
        .append($('<div id="rightContainer"></div>'))
        .append($('<div id="floatContainer"></div>'))

    // append icons on the bubble left
    SEARCH_ENGINE_ICONS.forEach(icon => {
        createIconDOM(icon).appendTo(bubble.find('#leftContainer'))
    });

    // append icons on the bubble right
    SYSTEM_COMMAND_ICONS.forEach(icon => {
        if (icon.command === 'pushtext') {
            // remove pushtext icon when on popup.html
            if (!location.href.includes('chrome-extension://')) {
                createIconDOM(icon).appendTo(bubble.find('#rightContainer'))
            }
        } else {
            createIconDOM(icon).appendTo(bubble.find('#rightContainer'))
        }
    });

    // append icons on the float container
    FLOAT_COMMAND_ICONS.forEach(icon => {
        createIconDOM(icon).appendTo(bubble.find('#floatContainer'))
    });

    return bubble;
}

const renderBubble = () => {
    let bubble = $('#bubble');

    setTimeout(() => {
        let selection = window.getSelection();

        if (selection.toString() === '') {
            bubble.addClass('hidden');
        } else {
            bubble.removeClass('hidden');

            // switch zoom icons
            chrome.runtime.sendMessage({
                command: 'GET_ZOOMFACTOR'
            }, response => {
                if (response.zoomFactor === 1) {
                    $('.zoom-icon').text('zoom_in');
                    $('.zoom-icon').title = 'ページを拡大';
                } else {
                    $('.zoom-icon').text('zoom_out')
                    $('.zoom-icon').title = 'ページ倍率をリセット'
                }
            });

            // set the bubble position based on selection
            let boundingCR = selection.getRangeAt(0).getBoundingClientRect();
            bubble.css('top', (boundingCR.top - 80) + window.scrollY + 'px')
            bubble.css('left', Math.floor((boundingCR.left + boundingCR.right) / 2) - 50 + window.scrollX + 'px');
        }
    }, 30)
}

const hideBubble = () => {
    if ($('#bubble').css('display') !== 'none') {
        $('#bubble').addClass('hidden');
    }
}

const sendCommandMessage = (command) => {
    let text = window.getSelection().toString();

    // only for popup.html
    if (location.href.includes('chrome-extension://')) {
        text = text.replace(/check\s$/, '');
        // // get url and title from footnote
        // let textitem = window.getSelection().getRangeAt(0).commonAncestorContainer.parentElement;
    }

    chrome.runtime.sendMessage({
        command: command,
        selection: text.trim()
    });
}

// attach bubble
$('body').append(createBubbleDOM());

// attach bubble to the loaded page
document.addEventListener('mouseup', renderBubble)