'use strict';

// attach event to onMessage
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    let selection = "";
    if (request.command === 'GET_SELCTION') {
        selection = window.getSelection().toString();
    }
    sendResponse({
        selection: selection
    });

    return true;
});