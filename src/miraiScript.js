chrome.runtime.sendMessage({}, response => {

	let sourceInput = document.querySelector('#translateSourceInput');
	let sourceLanguage = document.querySelector('#sourceButtonUrlTranslation');
	let targetLanguage = document.querySelector('#targetButtonTextTranslation');

	sourceInput.value = response.text;
	sourceLanguage.value = 'en';
	targetLanguage.value = 'ja';

	if (sourceInput.value !== '' && sourceLanguage.value !== '' && targetLanguage.value !== '') {
		document.querySelector('#translateButtonTextTranslation').removeAttribute('disabled');
		document.querySelector('#translateButtonTextTranslation').click();
	}
});