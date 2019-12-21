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
    // let current = new Date();

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
    chrome.storage.sync.get(['raw'], result => {
        let itemlist = [];
        if (typeof result.raw !== "undefined") {
            itemlist = JSON.parse(result.raw);
        }
        itemlist.push({
            content: content,
            url,
            title,
            date
        });
        chrome.storage.sync.set({
                raw: JSON.stringify(itemlist),
            },
            () => {
                // console.log("Added: " + text + ' & ' + url);
            });
    });
}

export {
    copyTextWithTitleUrl,
    pushText
}