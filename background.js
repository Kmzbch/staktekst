'use strict';

const MENU_ITEMS = [
	{
		id: 'extendedcopy',
		title: chrome.i18n.getMessage('com_copy'),
		contexts: [ 'selection' ]
	},
	{
		id: 'pushtext',
		title: chrome.i18n.getMessage('com_push'),
		contexts: [ 'page', 'selection' ]
	},
	{
		id: 'search1',
		title: chrome.i18n.getMessage('se_google'),
		contexts: [ 'selection' ],
		url: 'https://encrypted.google.com/search?hl=en&gl=en&q=%s'
	},
	{
		id: 'search2',
		title: chrome.i18n.getMessage('se_vocabulary'),
		contexts: [ 'selection' ],
		url: 'https://www.vocabulary.com/dictionary/%s'
	},
	{
		id: 'search3',
		title: chrome.i18n.getMessage('se_doppl'),
		contexts: [ 'selection' ],
		url: 'https://dopeoplesay.com/q/%s'
	},
	{
		id: 'search4',
		title: chrome.i18n.getMessage('se_skell'),
		contexts: [ 'selection' ],
		url: 'https://skell.sketchengine.co.uk/run.cgi/concordance?lpos=&query=%s'
	},
	{
		id: 'search5',
		title: chrome.i18n.getMessage('se_netspeak'),
		contexts: [ 'selection' ],
		url: 'https://netspeak.org/#q=%s&corpus=web-en'
	},
	{
		id: 'search6',
		title: chrome.i18n.getMessage('se_youglish'),
		contexts: [ 'selection' ],
		url: 'https://youglish.com/search/%s'
	},
	{
		id: 'deepl',
		url:
			'https://www.deepl.com/translator#en/' +
			(window.navigator.language || chrome.i18n.getMessage('html_lang')) +
			'/%s',
		title: chrome.i18n.getMessage('se_deepl'),
		contexts: [ 'selection' ]
	},

	{
		id: 'oddcast',
		title: chrome.i18n.getMessage('se_oddcast'),
		contexts: [ 'selection' ],
		url: 'http://www.oddcast.com/ttsdemo/index.php'
	}
];

let USER_ITEMS = [];
let zoominPercentage;

let command = '';

const executeUserCommand = (commandId, text, tabTitle, tabUrl, tabId) => {
	switch (commandId) {
		// system features
		case 'extendedcopy':
			copyTextWithTitleUrl(text, tabTitle, tabUrl);
			break;
		case 'pushtext':
			pushText(text, 'clip', tabTitle, tabUrl);
			break;
		case 'bookmark':
			pushText(tabTitle + '\n' + tabUrl, 'bookmark', '', '');
			break;
		case 'switchzoom':
			chrome.tabs.getZoom(tabId, (zoomFactor) => {
				// TODO: config
				zoomFactor = zoomFactor === 1 ? zoominPercentage / 100 : 1;
				chrome.tabs.setZoom(tabId, zoomFactor, function(zoomFactor) {
					console.log('zoom factor:' + zoomFactor);
				});
			});
			break;
		// web features
		default:
			if (USER_ITEMS.length > 0) {
				command = USER_ITEMS.find((item) => item.id === commandId);
			} else {
				command = MENU_ITEMS.find((item) => item.id === commandId);
			}
			let urlWithQuery = command.url.replace('%s', text);
			if (commandId === 'deepl') {
				chrome.i18n.detectLanguage(text, (res) => {
					urlWithQuery = urlWithQuery.replace(/translator#en/, 'translator#' + res.languages[0].language);
					// open the URL
					chrome.tabs.create({
						url: urlWithQuery
					});
				});
			} else {
				// open the URL
				chrome.tabs.create({
					url: urlWithQuery
				});
			}
			break;
	}
};

// get a message from content script
const getMessage = (request, sender, sendResponse) => {
	// message info
	console.log(sender.tab ? 'from a content script:' + sender.tab.url : 'from the extension');
	console.log(request.command);

	// query for the current tab
	chrome.tabs.query(
		{
			currentWindow: true,
			active: true
		},
		(tabs) => {
			switch (request.command) {
				case 'GET_ZOOMFACTOR':
					// get the current zoom factor
					chrome.tabs.getZoom(tabs[0].id, (zoomFactor) => {
						sendResponse({
							zoomFactor: zoomFactor
						});
					});
					break;
				case 'OPTIONS':
					loadSettings();
					break;
				// case 'CHECK_RUNFIRSTTIME':
				// 	runFirstTime();
				// 	sendResponse({
				// 		message: 'checked!'
				// 	});
				// 	break;
				default:
					if (request.selection) {
						executeUserCommand(request.command, request.selection, tabs[0].title, tabs[0].url, tabs[0].id);
						selectionHolder = request.selection;
						commandHolder = request.command;
					}
					sendResponse({
						text: selectionHolder, // only used for oddcast
						command: commandHolder
					});

					break;
			}
		}
	);

	return true;
};

let selectionHolder = null;
let commandHolder = '';

// attach getMessage to onMessage event
chrome.runtime.onMessage.addListener(getMessage);

// attach context menu onclicked ivent
chrome.contextMenus.onClicked.addListener((menuInfo, tab) => {
	chrome.tabs.sendMessage(
		tab.id,
		{
			command: 'GET_SELCTION'
			/* message: "additional message here" */
		},
		(response) => {
			let text = response.selection;
			executeUserCommand(menuInfo.menuItemId, text, tab.title, tab.url, tab.id);
			selectionHolder = text;
			commandHolder = menuInfo.menuItemId;
		}
	);
});

//
function loadSettings() {
	chrome.storage.local.get([ 'options' ], (res) => {
		// load config
		if (typeof res.options === 'undefined' || res.options.contextMenuEnabled) {
			// reset and create context menus
			chrome.contextMenus.removeAll(() => {
				// MENU_ITEMS.forEach((item) => {
				// 	let picked = (({ id, title, type, contexts }) => ({
				// 		id,
				// 		title,
				// 		type,
				// 		contexts
				// 	}))(item);
				// 	chrome.contextMenus.create(picked);
				// });
				let menuItems =
					typeof res.options === 'undefined'
						? MENU_ITEMS
						: MENU_ITEMS.slice(0, 2).concat(res.options.searchEngines);
				menuItems.forEach((item) => {
					let picked = (({ id, title, type, contexts }) => ({
						id,
						title,
						type,
						contexts
					}))(item);
					chrome.contextMenus.create(picked);
				});
			});
		} else {
			chrome.contextMenus.removeAll(() => {});
		}

		if (typeof res.options !== 'undefined') {
			USER_ITEMS.length = 0;
			res.options.searchEngines.forEach((s) => {
				console.log(s.url);
				USER_ITEMS.push({
					id: s.id,
					title: s.title,
					contexts: [ 'selection' ],
					url: s.url
				});
			});
			USER_ITEMS = USER_ITEMS.concat(MENU_ITEMS.slice(-2));
		}

		zoominPercentage = typeof res.options !== 'undefined' ? res.options.zoominPercentage : 150;
	});
}

//
// runFirstTime();

//
loadSettings();
