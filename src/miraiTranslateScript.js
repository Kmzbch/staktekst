'use strict';

chrome.runtime.sendMessage({}, response => {
	let text = document.querySelector('#translateSourceInput');
	let translateFrom = document.querySelector('#sourceButtonUrlTranslation');
	let translateInto = document.querySelector('#targetButtonTextTranslation');

	text.value = response.text;
	translateFrom.value = 'en';
	translateInto.value = 'ja';

	if (text.value !== '' && translateFrom.value !== '' && translateInto.value !== '') {
		document.querySelector('#translateButtonTextTranslation').removeAttribute('disabled');
		document.querySelector('#translateButtonTextTranslation').click();
	}
});