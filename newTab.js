'use strict';

const DELAY = 4000;

chrome.runtime.sendMessage({}, response => {
	switch (response.command) {
		case 'mirai':
			// enter necessary inputs
			$('#translateSourceInput').val(response.text.replace(/ +|\n/g, " "))
			$('#sourceButtonUrlTranslation').val('en');
			$('#targetButtonTextTranslation').val('ja');

			// click translation button
			if ($('#translateSourceInput').val()) {
				$('#translateButtonTextTranslation').prop('disabled', false);
				$('#translateButtonTextTranslation').trigger('click');
			}

			break;

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