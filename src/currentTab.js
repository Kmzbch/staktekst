// prepare for getting messages from background.js
chrome.runtime.onMessage.addListener(getMessage);

function getMessage(request, sender, sendResponse) {
    //    console.log(request.message);
    sendResponse({
        selection: window.getSelection().toString()
    });
}