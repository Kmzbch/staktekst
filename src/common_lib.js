function copyTextWithTitleUrl(text, title, url) {
    // use hidden DOM to copy text
    var copyFrom = document.createElement("textarea");
    copyFrom.textContent = text + "\n\n" + title + "\n" + url;
    document.body.appendChild(copyFrom);
    copyFrom.select();
    document.execCommand('copy');
    copyFrom.blur();
    document.body.removeChild(copyFrom);
}

function pushText(text, url) {
    chrome.storage.sync.get(['raw'], result => {
        let itemlist = [];
        if (typeof result.raw !== "undefined") {
            itemlist = JSON.parse(result.raw);
        }
        itemlist.push({
            text,
            url
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