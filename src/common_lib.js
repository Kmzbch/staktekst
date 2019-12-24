function copyTextWithTitleUrl(content, title, url) {
    // use hidden DOM to copy text
    let copyFrom = document.createElement("textarea");
    copyFrom.textContent = content + "\n\n" + title + "\n" + url;
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

function extractTextInfo(text) {
    let charCount = text.length;
    let wordCount = charCount === 0 ? 0 : text.split(' ').length;
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


function pushText(content, url = "", pageTitle = "", noteTitle = "", date = formatDate()) {
    chrome.storage.local.get(['raw'], result => {
        let stack = [];
        if (typeof result.raw !== "undefined") {
            stack = JSON.parse(result.raw);
        }
        // stack.push({
        //     content: content,
        //     url,
        //     title,
        //     date
        // });
        // stack.push({
        //     content: content,
        //     date,
        //     footnote: {
        //         title,
        //         url
        //     }
        // });
        stack.push({
            content: content,
            date,
            noteTitle,
            footnote: {
                pageTitle,
                url
            }
        });


        chrome.storage.local.set({
            raw: JSON.stringify(stack),
        });
    });
}

export {
    copyTextWithTitleUrl,
    pushText,
    escapeRegExp,
    extractTextInfo,
    containsJapanese,
    formatDate
}