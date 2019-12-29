function copyTextWithTitleUrl(content, title, url) {
    // use hidden DOM to copy text
    let copyFrom = document.createElement('textarea');
    copyFrom.textContent = content + '\n\n' + title + '\n' + url;
    document.body.appendChild(copyFrom);
    copyFrom.select();
    document.execCommand('copy');
    copyFrom.blur();
    document.body.removeChild(copyFrom);
}

function escapeRegExp(string) {
    const reRegExp = /[\\^$.*+?()[\]{}|]/g,
        reHasRegExp = new RegExp(reRegExp.source);

    return (string && reHasRegExp.test(string)) ?
        string.replace(reRegExp, '\\$&') :
        string;
}

function extractTextInfo(string) {
    let charCount = string.length;
    let wordCount = charCount === 0 ? 0 : string.split(' ').length;
    return {
        charCount: charCount,
        wordCount: wordCount
    };
}

function containsJapanese(string) {
    return string.match(/[\u30a0-\u30ff\u3040-\u309f\u3005-\u3006\u30e0-\u9fcf]+?/) ? true : false
}

function formatDate(date = new Date()) {
    let yyyy = date.getFullYear();
    let mm = date.getMonth() + 1;
    let dd = date.getDate();

    if (mm < 10) {
        mm = '0' + mm;
    }
    if (dd < 10) {
        dd = '0' + dd;
    }

    return `${yyyy}-${mm}-${dd}`;
}

function pushText(content, pageTitle = '', url = '') {
    const stackStorage = {
        get: callback => {
            chrome.storage.local.get(['raw'], result => {
                callback(result.raw);
            });
        },
        set: (value) => {
            chrome.storage.local.set({
                raw: value,
            });
        },
        reset: () => {
            chrome.storage.local.set({
                raw: '[]'
            });
        }
    };


    stackStorage.get(raw => {

        if (typeof raw === 'undefined') {
            stackStorage.reset();
        } else {
            let stack = JSON.parse(raw);
            console.log(stack);
            stack.push({
                content: content,
                date: formatDate(),
                noteTitle: '',
                footnote: {
                    pageTitle,
                    url,
                    // hashtag: ['clip']
                    hashtag: []
                }
            });
            stackStorage.set(JSON.stringify(stack));
        }
    });
}

function adjustDOMHeight(ta, minHeight) {
    const isOverflown = ({
        clientWidth,
        clientHeight,
        scrollWidth,
        scrollHeight
    }) => {
        return scrollHeight > clientHeight || scrollWidth > clientWidth;
    }

    // variable height
    while (!isOverflown(ta)) {
        let initialHeight = parseFloat(getComputedStyle(ta).height);
        if (initialHeight < minHeight) {} else {
            ta.style.height = (initialHeight - 10) + "px";
        }
    }

    while (isOverflown(ta)) {
        let initialHeight = parseFloat(getComputedStyle(ta).height);
        let adjustedHeight = (initialHeight + 10);
        if (adjustedHeight < minHeight) {
            adjustedHeight = minHeight;
        }
        ta.style.height = adjustedHeight + "px";
    }

}


export {
    copyTextWithTitleUrl,
    pushText,
    escapeRegExp,
    extractTextInfo,
    containsJapanese,
    formatDate,
    adjustDOMHeight
}