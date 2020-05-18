'use strict';

// search engines for bubble menu
const MENU_ITEMS = [
	{
		id: 'extendedcopy',
		title: 'URL付きでコピー',
		contexts: [ 'selection' ]
	},
	{
		id: 'pushtext',
		title: 'テキストをスタックにプッシュ',
		contexts: [ 'page', 'selection' ]
	},
	// {
	// 	id: 'twitter',
	// 	title: 'Twitter',
	// 	contexts: [ 'selection' ],
	// 	url: 'https://twitter.com/search?q=%s'
	// },
	// {
	// 	id: 'urban',
	// 	title: 'Urban Dictionary',
	// 	contexts: [ 'selection' ],
	// 	url: 'https://www.urbandictionary.com/define.php?term=%s'
	// },
	{
		id: 'google',
		title: chrome.i18n.getMessage('se_google'),
		contexts: [ 'selection' ],
		url: 'https://encrypted.google.com/search?hl=en&gl=en&q=%s'
	},
	{
		id: 'vocabulary',
		title: chrome.i18n.getMessage('se_vocabulary'),
		contexts: [ 'selection' ],
		url: 'https://www.vocabulary.com/dictionary/%s'
	},
	{
		id: 'dopeoplesayit',
		title: chrome.i18n.getMessage('se_doppl'),
		contexts: [ 'selection' ],
		url: 'https://dopeoplesay.com/q/%s'
	},
	{
		id: 'skell',
		title: chrome.i18n.getMessage('se_skell'),
		contexts: [ 'selection' ],
		url: 'https://skell.sketchengine.co.uk/run.cgi/concordance?lpos=&query=%s'
	},
	{
		id: 'netspeak',
		title: chrome.i18n.getMessage('se_netspeak'),
		contexts: [ 'selection' ],
		url: 'https://netspeak.org/#q=%s&corpus=web-en'
	},
	{
		id: 'youglish',
		title: chrome.i18n.getMessage('se_youglish'),
		contexts: [ 'selection' ],
		url: 'https://youglish.com/search/%s'
	},
	{
		id: 'mirai',
		url: 'https://miraitranslate.com/en/trial/',
		title: chrome.i18n.getMessage('se_mirai'),
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
				zoomFactor = zoomFactor === 1 ? 1.5 : 1;
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

			// let command = MENU_ITEMS.find((item) => item.id === commandId);
			let urlWithQuery = command.url.replace('%s', text);
			// open the URL
			chrome.tabs.create({
				url: urlWithQuery
			});
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
					setContextMenus();
					setSearchEngines();
				default:
					if (request.selection) {
						executeUserCommand(request.command, request.selection, tabs[0].title, tabs[0].url, tabs[0].id);
						selectionHolder = request.selection;
						commandHolder = request.command;
					}
					sendResponse({
						text: selectionHolder, // only used for mirai translate and oddcast
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
function setContextMenus() {
	chrome.storage.sync.get([ 'options' ], (res) => {
		// load config
		if (typeof res.options === 'undefined' || res.options.contextMenuEnabled) {
			// reset and create context menus
			chrome.contextMenus.removeAll(() => {
				MENU_ITEMS.forEach((item) => {
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
	});
}

function setSearchEngines() {
	chrome.storage.sync.get([ 'options' ], (res) => {
		if (typeof res.options !== 'undefined') {
			USER_ITEMS.length = 0;
			res.options.searchEngines.forEach((s) => {
				console.log(s.url);
				USER_ITEMS.push({
					id: s.id,
					title: s.name,
					contexts: [ 'selection' ],
					url: s.url
				});
			});
			USER_ITEMS = USER_ITEMS.concat(MENU_ITEMS.slice(-2));
		}
	});
}

setContextMenus();
setSearchEngines();
