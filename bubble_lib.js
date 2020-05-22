/**
 * Staktekst (https://github.com/Kmzbch/staktekst)
 * Copyright 2020-present Kei Mizubuchi
 * Licensed under MIT
 */
'use strict';

const SEARCH_ENGINE_ICONS = [
	{
		className: 'mdi mdi-magnify stackButton',
		title: chrome.i18n.getMessage('se_google'),
		command: 'search1'
	},
	{
		className: 'mdi mdi-check stackButton',
		title: chrome.i18n.getMessage('se_vocabulary'),
		command: 'search2'
	},

	{
		className: 'mdi mdi-account-multiple stackButton',
		title: chrome.i18n.getMessage('se_doppl'),
		command: 'search3'
	},
	{
		className: 'mdi mdi-format-list-numbered stackButton',
		title: chrome.i18n.getMessage('se_skell'),
		command: 'search4'
	},
	{
		className: 'mdi mdi-chart-histogram stackButton',
		title: chrome.i18n.getMessage('se_netspeak'),
		command: 'search5'
	},
	{
		className: 'mdi mdi-youtube stackButton',
		title: chrome.i18n.getMessage('se_youglish'),
		command: 'search6'
	},
	{
		className: 'mdi mdi-translate stackButton',
		title: chrome.i18n.getMessage('se_deepl'),
		command: 'search7'
	},
	{
		className: 'mdi mdi-text-to-speech stackButton',
		title: chrome.i18n.getMessage('se_googletranslate'),
		command: 'search8'
	}
	// {
	// 	className: 'mdi mdi-text-to-speech stackButton',
	// 	title: chrome.i18n.getMessage('se_oddcast'),
	// 	command: 'oddcast'
	// }
];

const SYSTEM_COMMAND_ICONS = [
	{
		className: 'mdi mdi-paperclip stackButton',
		title: chrome.i18n.getMessage('com_push'),
		command: 'pushtext'
	},
	{
		className: 'mdi mdi-clipboard-text stackButton',
		title: chrome.i18n.getMessage('com_copy'),
		command: 'extendedcopy'
	}
];

const FLOAT_COMMAND_ICONS = [
	{
		className: 'mdi mdi-bookmark-multiple bookmark-icon',
		title: chrome.i18n.getMessage('com_bookmark'),
		command: 'bookmark'
	},
	{
		className: 'mdi mdi-magnify-plus-outline zoom-icon',
		title: chrome.i18n.getMessage('com_zoomin'),
		command: 'switchzoom'
	}
];

/* DOM creation and manipulation */
const createIconDOM = ({ className, title, command }) => {
	return $('<i>', {
		addClass: className,
		title: title,
		text: '',
		on: {
			mousedown: () => {
				textHolder = window.getSelection().toString();
			},
			mouseup: () => {
				sendCommandMessage(command);
				window.getSelection().removeAllRanges();
				renderBubble();
			}
		}
	});
};

let USER_DEFINED_ICONS = [];

const createBubbleDOM = () => {
	let bubble = $('<div id="bubble"></div>')
		.append($('<div id="leftContainer"></div>'))
		.append($('<div id="rightContainer"></div>'))
		.append($('<div id="floatContainer"></div>'));
	$(bubble).hide();

	// // append icons on the bubble left
	if (USER_DEFINED_ICONS.length !== 0) {
		// append icons on the bubble left
		USER_DEFINED_ICONS.forEach((icon) => {
			createIconDOM(icon).appendTo(bubble.find('#leftContainer'));
		});
	} else {
		// append icons on the bubble left
		SEARCH_ENGINE_ICONS.forEach((icon) => {
			createIconDOM(icon).appendTo(bubble.find('#leftContainer'));
		});
	}

	// append icons on the bubble right
	SYSTEM_COMMAND_ICONS.forEach((icon) => {
		if (icon.command === 'pushtext') {
			// remove pushtext icon when on popup.html
			if (!location.href.includes('chrome-extension://')) {
				createIconDOM(icon).appendTo(bubble.find('#rightContainer'));
			}
		} else {
			createIconDOM(icon).appendTo(bubble.find('#rightContainer'));
		}
	});

	// append icons on the float container
	FLOAT_COMMAND_ICONS.forEach((icon) => {
		createIconDOM(icon).appendTo(bubble.find('#floatContainer'));
	});

	return bubble;
};

const renderBubble = () => {
	let bubble = $('#bubble');

	// setTimeout(() => {
	let selection = window.getSelection();

	if (selection.toString() === '') {
		$(bubble).fadeOut(70, () => {
			$(bubble).hide();
		});
	} else {
		$(bubble).show();

		// switch zoom icons
		chrome.runtime.sendMessage(
			{
				command: 'GET_ZOOMFACTOR'
			},
			(response) => {
				if (response.zoomFactor === 1) {
					$('.zoom-icon').removeClass('mdi-magnify-minus-outline');
					$('.zoom-icon').addClass('mdi-magnify-plus-outline');
					$('.zoom-icon').title = chrome.i18n.getMessage('com_zoomin');
				} else {
					$('.zoom-icon').removeClass('mdi-magnify-plus-outline');
					$('.zoom-icon').addClass('mdi-magnify-minus-outline');
					$('.zoom-icon').title = chrome.i18n.getMessage('com_zoomout');
				}
			}
		);

		// set the bubble position based on selection
		let boundingCR = selection.getRangeAt(0).getBoundingClientRect();
		bubble.css('top', boundingCR.top - 80 + window.scrollY + 'px');
		bubble.css('left', Math.floor((boundingCR.left + boundingCR.right) / 2) - 50 + window.scrollX + 'px');
	}
};

const hideBubble = () => {
	$(bubble).fadeOut(70, () => {
		$(bubble).hide();
	});
};

let textHolder = '';
const sendCommandMessage = (command) => {
	let text = window.getSelection().toString();

	if (text == '') {
		text = textHolder;
	}

	chrome.runtime.sendMessage({
		command: command,
		selection: text.trim()
	});
};

chrome.storage.local.get([ 'options' ], (res) => {
	// load config
	if (typeof res.options !== 'undefined') {
		if (res.options.balloonMenuEnabled) {
			if (typeof res.options.searchEngines !== 'undefined') {
				res.options.searchEngines.forEach((s) => {
					USER_DEFINED_ICONS.push({
						className: s.class + ' stackButton',
						title: s.title,
						command: s.id
					});
				});

				// USER_DEFINED_ICONS = USER_DEFINED_ICONS.concat(SEARCH_ENGINE_ICONS.slice(-2));
			}

			// attach bubble
			$('body').append(createBubbleDOM());

			// attach bubble to the loaded page
			document.addEventListener('mouseup', renderBubble);
		}
	} else {
		// attach bubble
		$('body').append(createBubbleDOM());

		// attach bubble to the loaded page
		document.addEventListener('mouseup', renderBubble);
	}
});
