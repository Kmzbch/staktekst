'use strict';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	// get selected text
	let selection = '';
	if (request.command === 'GET_SELCTION') {
		selection = window.getSelection().toString();
	}
	// send to background.js
	sendResponse({
		selection: selection
	});

	return true;
});
