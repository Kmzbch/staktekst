'use strict';

const DELAY = 4000;

// send a message to background.js and receive which website has been queried
chrome.runtime.sendMessage({}, (response) => {
	switch (response.command) {
		case 'oddcast':
			// set parameters to the value/attributes
			$('#flash-speck-area').val(response.text);
			$('#languageBtn').attr('data-val', '1');
			$('#voiceBtn').attr('data-val', '7');
			$('#voiceBtn').attr('data-eng', '3');
			$('#effectBtn').attr('data-val', 'T');
			$('#levelBtn').attr('data-val', '2');
			// fire click event after a while
			setTimeout(() => {
				$('#play-speaking').click();
			}, DELAY);
			break;
		default:
			break;
	}
});
