/**
 * Staktekst (https://github.com/Kmzbch/staktekst)
 * Copyright 2020-present Kei Mizubuchi
 * Licensed under MIT
 */

function copyTextWithTitleUrl(content, title, url) {
	// use hidden DOM to copy text
	let copyFrom = document.createElement('textarea');
	copyFrom.textContent = content + '\n\n' + title + '\n' + url;
	document.body.appendChild(copyFrom);
	copyFrom.select();
	document.execCommand('copy');
	copyFrom.blur();
	document.body.removeChild(copyFrom);
}

function escapeRegExp(string) {
	const reRegExp = /[\\^$.*+?()[\]{}|]/g,
		reHasRegExp = new RegExp(reRegExp.source);

	return string && reHasRegExp.test(string) ? string.replace(reRegExp, '\\$&') : string;
}

function extractTextInfo(string) {
	let charCount = string.length;
	let wordCount = charCount === 0 ? 0 : string.split(' ').length;
	return {
		charCount: charCount,
		wordCount: wordCount
	};
}

function containsJapanese(string) {
	// check if multibyte characters are found
	return string.match(/[^\x01-\x7E]+?/) ? true : false;
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

function uuidv4() {
	return ([ 1e7 ] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
		(c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
	);
}

const stackStorage = {
	get: (callback) => {
		chrome.storage.local.get([ 'raw' ], (result) => {
			callback(result.raw);
		});
	},
	set: (value) => {
		chrome.storage.local.set({
			raw: value
		});
	},
	reset: () => {
		chrome.storage.local.set({
			raw: '[]'
		});
	}
};

function pushText(content, type, pageTitle = '', pageURL = '') {
	stackStorage.get((raw) => {
		if (typeof raw === 'undefined') {
			stackStorage.reset();
		} else {
			let stack = JSON.parse(raw);
			// escape &gt; &lt;
			content = content.replace('<', '&lt;');
			content = content.replace('>', '&gt;');
			pageTitle = pageTitle.replace('<', '&lt;');
			pageTitle = pageTitle.replace('>', '&gt;');

			stack.push({
				id: uuidv4(),
				type: type,
				date: new Date().toISOString(),
				content: content,
				footnote: {
					tags: [],
					pageTitle: pageTitle,
					pageURL: pageURL
				}
			});
			stackStorage.set(JSON.stringify(stack));
		}
	});
}

function fitHeightToContent(textarea) {
	const isOverflown = ({ clientWidth, clientHeight, scrollWidth, scrollHeight }) => {
		return scrollHeight > clientHeight || scrollWidth > clientWidth;
	};

	// variable height
	while (!isOverflown(textarea)) {
		let initialHeight = parseFloat(getComputedStyle(textarea).height);
		let minHeight = parseFloat(getComputedStyle(textarea).minHeight);

		if (initialHeight <= minHeight) {
			break;
		} else {
			if (initialHeight > minHeight) {
				textarea.style.height = initialHeight - 10 + 'px';
			}
		}
	}

	while (isOverflown(textarea)) {
		let initialHeight = parseFloat(getComputedStyle(textarea).height);
		let minHeight = parseFloat(getComputedStyle(textarea).minHeight);

		let adjustedHeight = initialHeight + 10;
		if (adjustedHeight < minHeight) {
			adjustedHeight = minHeight;
		}
		textarea.style.height = adjustedHeight + 'px';
	}
}

function enableURLEmbededInText(text) {
	return text.replace(/(https?:[\.\/\w-%?&=#+;,]+)/g, "<span class='pseudolink' href='$1' target='_blank'>$1</span>");
}

// ========== UTILITIES ==========
// https://stackoverflow.com/questions/25467009/internationalization-of-html-pages-for-my-google-chrome-extension/39810769
const localizeHtmlPage = () => {
	//Localize by replacing __MSG_***__ meta tags
	var objects = document.getElementsByTagName('html');
	for (var j = 0; j < objects.length; j++) {
		var obj = objects[j];

		var valStrH = obj.innerHTML.toString();
		var valNewH = valStrH.replace(/__MSG_(\w+)__/g, function(match, v1) {
			return v1 ? chrome.i18n.getMessage(v1) : '';
		});

		if (valNewH != valStrH) {
			obj.innerHTML = valNewH;
		}
	}
};
