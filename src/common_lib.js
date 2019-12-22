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

function pushText(content, url = "", title = "", date = formatDate()) {
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
        stack.push({
            content: content,
            date,
            footnote: {
                title,
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
    pushText
}