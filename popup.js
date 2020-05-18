// background.js instance
const background = chrome.extension.getBackgroundPage();

// state variables
let stack = [];
let tagStack = [];
let dateStack = [];
let sortable = null; // SortableJS instance
let tagSortable; // SortableJS instance
let windowState = {
	searchQuery: '',
	scrollY: 0,
	sortedByNew: true
};
let shadowNodes = []; // clonde nodes for seach optimization

const preset = {
	restoreEnabled: true,
	duration: 30,
	balloonMenuEnabled: true,
	contextMenuEnabled: false,
	searchEngines: [
		{
			name: chrome.i18n.getMessage('se_google'),
			url: 'https://encrypted.google.com/search?hl=en&gl=en&q=%s',
			icon: {
				class: 'material-icons iconButton',
				text: 'search'
			}
		},
		{
			name: chrome.i18n.getMessage('se_vocabulary'),
			url: 'https://www.vocabulary.com/dictionary/%s',
			icon: {
				class: 'material-icons iconButton',
				text: 'check'
			}
		},
		{
			name: chrome.i18n.getMessage('se_doppl'),
			url: 'https://dopeoplesay.com/q/%s',
			icon: {
				class: 'material-icons iconButton',
				text: 'people'
			}
		},
		{
			name: chrome.i18n.getMessage('se_skell'),
			url: 'https://skell.sketchengine.co.uk/run.cgi/concordance?lpos=&query=%s',
			icon: {
				class: 'mdi mdi-alpha-s-box iconButton iconButton',
				text: ''
			}
		},
		{
			name: chrome.i18n.getMessage('se_netspeak'),
			url: 'https://netspeak.org/#q=%s&corpus=web-en',
			icon: {
				class: 'mdi mdi-alpha-n-box iconButton iconButton',
				text: ''
			}
		},

		{
			name: chrome.i18n.getMessage('se_youglish'),
			url: 'https://youglish.com/search/%s',
			icon: {
				class: 'mdi mdi-youtube iconButton iconButton',
				text: ''
			}
		}
	]
};
let options = {};

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

const importNotesFromJSON = async (path) => {
	const URL = chrome.runtime.getURL(path);
	$.getJSON(URL, (data) => {
		console.log('done');
		stackStorage.set(JSON.stringify(data.raw));
	});
};

const doAfterInputIsDone = (task, time) => {
	// clear timeout of undone task
	if (task in doAfterInputIsDone.TID) {
		window.clearTimeout(doAfterInputIsDone.TID[task]);
	}
	doAfterInputIsDone.TID[task] = window.setTimeout(() => {
		// clear task ID previously registered
		delete doAfterInputIsDone.TID[task];
		try {
			task.call();
		} catch (e) {
			console.log('EXCEPTION: ' + task);
		}
	}, time);
};

doAfterInputIsDone.TID = {};

const fireSearch = (query) => {
	$('.searchbox').val(query);
	$('.searchbox').trigger('input');
};

const replaceTagName = (prevTag, newTag) => {
	stack.forEach((item) => {
		if (item.footnote.tags.includes(prevTag)) {
			const prevTagIndex = item.footnote.tags.findIndex((tag) => tag.name == prevTag);
			item.footnote.tags.splice(prevTagIndex, 1, newTag);
		}
	});
	stackStorage.set(JSON.stringify(stack));
};

const exportStack = (ext) => {
	const IDs = [];

	// get IDs of unfiltered items
	$('#textstack .stackwrapper').each((index, wrapper) => {
		if (!$(wrapper).is(':hidden')) {
			IDs.push($(wrapper).attr('id'));
		}
	});

	// create exporting content
	const stackToExport = stack.slice(0).filter((item) => IDs.includes(item.id)).sort((a, b) => {
		a = new Date(a.date);
		b = new Date(b.date);
		if (!windowState.sortedByNew) {
			// NEW => OLD
			return a > b ? -1 : a < b ? 1 : 0;
		} else {
			// OLD => NEW
			return a > b ? 1 : a < b ? -1 : 0;
		}
	});

	if (ext === 'txt') {
		content = stackToExport.reduce((content, item) => {
			let header = '-----\n';
			header += 'created: ' + `'${item.date}'\n`;
			header += 'type: ' + `${item.type}\n`;
			header += 'tags: ' + `[${item.footnote.tags.join(',')}]\n`;
			header += '-----\n\n';

			// remove html tags
			const sanitizedContent = $('<div>', {
				html: item.content
			}).text();

			content += header + sanitizedContent + '\n';

			if (item.type === 'clip') {
				content += '\n';
				content += `${item.footnote.pageTitle}\n`;
				content += `${item.footnote.pageURL}\n`;
			}

			return (content += '\n');
		}, '');
	} else if (ext === 'json') {
		content = JSON.stringify(stackToExport);
	}

	// create blob
	const bom = new Uint8Array([ 0xef, 0xbb, 0xbf ]);
	const blob = new Blob([ bom, content ], {
		type: 'data:text/plain'
	});

	// create url and download the file
	window.URL = window.URL || window.webkitURL;
	const url = window.URL.createObjectURL(blob);
	chrome.downloads.download({
		url: url,
		filename: formatDate() + '.' + ext,
		saveAs: true
	});
};

// ========== DISPLAY ==========
const showDropdownList = () => {
	filterDropdownListItems($('.searchbox').val());
	$('#tagsearch-result').animate({ scrollTop: 0 }, 20);
	// show and select the first item
	$('#tagsearch-result').show();
	$('li').first().addClass('selected');
};

const hideDropdownList = () => {
	$('#tagsearch-result').hide();
	$('li.selected').removeClass('selected');
	if (tagSortable != null) {
		tagSortable.save();
	}
};

const displayMessage = (message) => {
	if ($('#statusboard').hasClass('entering')) {
		$('#statusboard').removeClass('entering');
	}
	$('#statusboard').text(message);
	$('#toolbox').hide();
};

const clearMessage = () => {
	$('#statusboard').text('');
	$('#toolbox').show();
	$('#statusboard').removeClass('entering');
};

const updateStatusBoard = (text) => {
	const info = extractTextInfo(text.replace(String.fromCharCode(8203), ''));
	$('#toolbox').hide();
	$('#statusboard').html(`${info.wordCount} words<span class="inlineblock">${info.charCount} chars</span>`);
	if (!$('#statusboard').hasClass('entering')) {
		$('#statusboard').addClass('entering');
	}
};

// ========== TOGGLE ==========
const toggleClearStackModal = (display = $('#clearstack-window.modal').hasClass('hidden') ? true : false) => {
	if (display) {
		$('#clearstack-window.modal').removeClass('hidden');
	} else {
		$('#clearstack-window.modal').addClass('hidden');
	}
};

const toggleFileExportModal = (display = $('#fileexport-window.modal').hasClass('hidden') ? true : false) => {
	if (display) {
		$('#fileexport-window.modal').removeClass('hidden');
	} else {
		$('#fileexport-window.modal').addClass('hidden');
	}
};

const toggleSortOrder = (sortingByNew) => {
	if (sortingByNew) {
		$('#sort').html(
			`<span class="sortText">New </span><i title="${chrome.i18n.getMessage(
				'hint_toggleorder'
			)}" class="material-icons">arrow_upward</i>`
		);
	} else {
		$('#sort').html(
			`<span class="sortText">Old </span><i title="${chrome.i18n.getMessage(
				'hint_toggleorder'
			)}" class="material-icons">arrow_downward</i>`
		);
	}

	if ($('.searchbox').val() !== '' && $('.searchbox').val()[0] === '#') {
		$('#sort .sortText').hide();
	} else {
		$('#sort .sortText').show();
	}

	if (sortable !== null) {
		$(shadowNodes[0]).children().each(function(i, wrapper) {
			$(shadowNodes[0]).prepend(wrapper);
		});
		windowState.sortedByNew = sortingByNew;
		// reverse by SortableJS
		sortable.sort(sortable.toArray().reverse());
		sortable.save();
	} else {
		reverseStack();
		windowState.sortedByNew = sortingByNew;
	}
};

const toggleEditorMode = (div, display = !$(div).attr('contentEditable') ? true : false) => {
	if (display) {
		$(div).attr('contentEditable', true);
		$(div).focus();
		// change visual styles
		$(div).parent().addClass('editing');
		$(div).next().children().first().hide(); // edit icon

		updateStatusBoard($(div).html());
	} else {
		$(div).attr('contentEditable', false);
		// replace new lines with br tag
		div.innerHTML = enableURLEmbededInText(div.innerText);
		div.innerHTML = div.innerHTML.replace(/\n+$/i, '');
		div.innerHTML = div.innerHTML.replace(/\n/gi, '<br>');
		div.innerHTML = div.innerHTML.replace(String.fromCharCode(8203), '');
		// change visual styles
		$(div).parent().removeClass('editing');
		$(div).next().children().first().show(); // edit icon
	}
};

// ========== FILTER ==========
const updateSearchResult = () => {
	const query = $('.searchbox').val().trim().toLowerCase();
	let hits;

	// filter note items
	if (query[0] === '#') {
		hits = filterNoteItemsByTag(query);
		$('.separator .tag').each((index, tag) => {
			// display separators associated to the tag
			if ($(tag).text() === query) {
				const separator = $(tag).parent().parent();
				separator.removeClass('filtered');
			}
		});
	} else if (query === ':d') {
		// search items with date tag
		hits = filterNoteItemsByTag(query);
	} else {
		// search note items
		hits = filterNoteItems(query);
	}

	filterDropdownListItems(query);

	// save sort order
	if (sortable !== null) {
		sortable.save();
	}

	// change styles on search
	if (query) {
		let locale = chrome.i18n.getUILanguage();
		if (locale === 'en') {
			displayMessage(hits === 0 ? chrome.i18n.getMessage('label_noresult_msg') : `${hits} of ${stack.length}`);
		} else if (locale === 'ja') {
			displayMessage(hits === 0 ? chrome.i18n.getMessage('label_noresult_msg') : `全${stack.length}中${hits}件`);
		}
		$('.search-cancel-button').show();
		setTimeout(clearMessage, 5000);
	} else {
		clearMessage();
		$('.search-cancel-button').hide();
		hideDropdownList();
	}

	// save window state
	windowState.searchQuery = query;
};

const filterNoteItemsByTag = (query) => {
	let hits = 0;
	let predicate;

	if (query[0] === '#') {
		// filter by tag
		query = query.substring(1);
		predicate = (q) => $(q).text().match(new RegExp(`^${escapeRegExp(query)}`, 'i'));
	} else {
		// filter by date
		predicate = (q) => !isNaN(Date.parse($(q).text()));
	}

	$('#textstack').children().each((index, textItem) => {
		// filter date item
		if ($(textItem).hasClass('date')) {
			textItem.classList.add('filtered');
		} else {
			$(textItem).find('.tag').each((index, tag) => {
				if (predicate(tag)) {
					// filter date item
					textItem.classList.remove('filtered');
					hits++;
					return false;
				} else {
					textItem.classList.add('filtered');
				}
			});
		}
	});

	$('#textstack').addClass('infilter');
	$('.sepGenerator.hidden').removeClass('hidden');

	return hits;
};

const filterNoteItems = (term) => {
	const stackDOM = document.querySelector('#textstack');
	let termRegex;
	let hits = 0;

	// Search in Japanese/English
	if (containsJapanese(term)) {
		termRegex = new RegExp(`(${escapeRegExp(term)})`, 'i');
	} else {
		termRegex = new RegExp(`(?!<span .+? target="_blank"/>)(${escapeRegExp(term)})(.*?)(?!</span>)`, 'i');
	}

	Array.from(stackDOM.children)
		.map((textItem) => {
			if (textItem.textContent.match(termRegex)) {
				textItem.classList.remove('filtered');
				hits++;
			} else {
				textItem.classList.add('filtered');
			}
			return textItem;
		})
		.filter((textItem) => !textItem.classList.contains('date'))
		.filter((textItem) => !textItem.classList.contains('filtered'))
		.forEach((textItem) => {
			let contentDIV = textItem.firstElementChild;
			contentDIV.innerHTML = enableURLEmbededInText(contentDIV.innerText);
			contentDIV.innerHTML = contentDIV.innerHTML.replace(/\n/gi, '<br>');
			if (term.length >= 1) {
				$(contentDIV).highlight(term, { element: 'span', className: 'highlighted' });
			}
		});

	return hits;
};

// ========== DROPDOWN LIST ==========
const selectOnDropdownList = (e) => {
	const liSelected = $('#tagsearch-result .selected');
	const unfiltered = $('li').not('.filtered');
	const index = unfiltered.index(liSelected);

	if ($('#tagsearch-result').is(':hidden')) {
		if (e.keyCode === Keys.DOWN) {
			// display dropdownlist
			if ($('li').not('.flitered').length > 0 || $('.searchbox').val() === '') {
				showDropdownList();
			}
		}
	} else {
		if (e.keyCode === Keys.ENTER) {
			if (liSelected) {
				// search by the tag
				liSelected.removeClass('selected');
				fireSearch('#' + liSelected.text().replace(/edit$/, ''));
			}
			hideDropdownList();
		} else if (e.keyCode === Keys.UP) {
			if (liSelected) {
				if (index - 1 >= 0) {
					// move up
					liSelected.removeClass('selected');
					$(unfiltered[index - 1]).addClass('selected');

					// scroll
					const newLiSelectedY = $(unfiltered[index - 1]).position().top;
					const newLiSelectedHeight = $(unfiltered[index - 1]).innerHeight();
					const innerHeight = $('#tagsearch-result').position().top;
					const scrollTop = $('#tagsearch-result').scrollTop();

					if (newLiSelectedY <= innerHeight - newLiSelectedHeight) {
						$('#tagsearch-result').animate(
							{ scrollTop: scrollTop - scrollTop % newLiSelectedHeight - newLiSelectedHeight },
							20
						);
					}
				} else {
					// if no item to select at the top
					hideDropdownList();
				}
			}
		} else if (e.keyCode === Keys.DOWN) {
			if (liSelected) {
				if (unfiltered.length > index + 1) {
					// move down
					liSelected.removeClass('selected');
					$(unfiltered[index + 1]).addClass('selected');

					// scroll
					const newLiSelectedY = $(unfiltered[index + 1]).position().top;
					const newLiSelectedHeight = $(unfiltered[index + 1]).height();
					const innerHeight = $('#tagsearch-result').innerHeight();
					const scrollTop = $('#tagsearch-result').scrollTop();

					if (newLiSelectedY > innerHeight - newLiSelectedHeight) {
						$('#tagsearch-result').animate(
							{
								scrollTop:
									$('#tagsearch-result').position().top +
									scrollTop +
									(scrollTop % newLiSelectedHeight + newLiSelectedHeight)
							},
							0
						);
					}
				}
			} else {
				// if no item to select at the bottom
				unfiltered[0].classList.add('selected');
			}
		}
	}
};

const filterDropdownListItems = (query) => {
	const tagName = query.trim()[0] === '#' ? query.trim().toLowerCase().slice(1) : query.trim().toLowerCase();
	const termRegex = new RegExp(`^(${escapeRegExp(tagName)})(.*?)`, 'i');
	$.map($('#tagsearch-result').children(), (listItem) => {
		if ($(listItem).text().match(termRegex)) {
			listItem.classList.remove('filtered');
		} else {
			listItem.classList.add('filtered');
		}
		return listItem;
	});
};

const setDropdownListItems = () => {
	$('#tagsearch-result').empty();

	// create list from tagStack
	tagStack
		.filter((item) => isNaN(Date.parse(item.name))) // filter duedate tag
		.filter((item) => !item.name.match(/pinned|📌/)) // filter pinned tag
		.forEach((tag) => {
			if (tag.name !== '') {
				const listItem = generateListItemHTML(tag);
				$('#tagsearch-result').append(listItem);
				attachListItemEvents(listItem);
			}
		});

	// create SortableJS instance for dropdownlist tag
	tagSortable = Sortable.create(document.querySelector('#tagsearch-result'), {
		sort: true,
		delay: 200,
		animation: 150,
		dataIdAttr: 'id',
		group: 'tagsearch',
		filter: '.placeholder',
		store: {
			get: (sortable) => {
				const order = localStorage.getItem(sortable.options.group.name);
				return order ? order.split('|') : [];
			},
			set: (sortable) => {
				const order = sortable.toArray();
				localStorage.setItem(sortable.options.group.name, order.join('|'));
			}
		}
	});
};

const setTagAddAutoComplete = (jqueryDOM) => {
	const tagSet = tagStack.map((item) => item.name).filter((tag) => isNaN(new Date(tag))).sort();

	$(jqueryDOM)
		.autocomplete({
			minLength: 0,
			delay: 0,
			source: function(request, response) {
				response(
					jQuery.grep(tagSet, function(value) {
						return value.includes(request.term);
					})
				);
			},
			select: function(event, ui) {
				jqueryDOM.val(ui.item.name);
				setTimeout(() => {
					event.target.focus();
					event.target.blur();
				}, 100);
			}
		})
		.dblclick(function() {
			jQuery(this).autocomplete('search', '');
		});
};

// ========== HTML generators ==========
const generateNoteItemHTML = ({ id, type, content, footnote, date }) => {
	// add the most outer opening tag
	let noteItemHTML = `<div class="stackwrapper ${type}" id="${id}">`;

	// add content body
	noteItemHTML += `<div class='content'>${enableURLEmbededInText(content).replace(/\n/gi, '<br>')}</div>`;
	noteItemHTML += `<div style="display:inline;"><i title="${chrome.i18n.getMessage(
		'hint_editnote'
	)}" class="material-icons edit">edit</i>`;
	noteItemHTML += `<div><i title="${chrome.i18n.getMessage(
		'hint_removenote'
	)}" class="material-icons checkbox">check</i></div>`;
	noteItemHTML += `<input type="hidden" value="${id}">`;
	noteItemHTML += `<input class='itemDate' type='hidden' value="${date}">`;
	noteItemHTML += `<div class="spacer"></div>`;

	// add footnote
	if (type === 'clip') {
		noteItemHTML += `<div class="footnote"><span class="pseudolink" href="${footnote.pageURL}" target="_blank" title="${footnote.pageTitle}">${footnote.pageTitle}</span>`;
		noteItemHTML += `<span class="tag type clip">clip</span>`;
	} else {
		noteItemHTML += `<div class="footnote"><span title="${chrome.i18n.getMessage(
			'hint_searchtag'
		)}" class="tag type">${type}</span>`;
	}

	// add tags to footnote
	let tagsHTML = '';
	if (typeof footnote.tags !== 'undefined') {
		footnote.tags.forEach((tagName) => {
			// change the tag to emoji
			if (tagName.match(/pinned|📌/i)) {
				tagName = tagName.replace(/pinned/i, '📌');
			}
			tagsHTML += generateTagsHTML(tagName);
		});
	}
	noteItemHTML += tagsHTML;

	// hide tag input if the note has more than 4 tags;
	// const classes = footnote.tags.length < 3 ? 'divWrap' : 'divWrap hidden';
	// noteItemHTML += `<div class="${classes}"><input title="${chrome.i18n.getMessage(
	// 	'hint_addtag'
	// )}" type="text" class="tagadd"></div>`;

	let classes;
	if (type === 'clip') {
		classes = footnote.tags.length < 2 ? 'divWrap' : 'divWrap hidden';
	} else {
		classes = footnote.tags.length < 3 ? 'divWrap' : 'divWrap hidden';
	}

	noteItemHTML += `<div class="${classes}"><input title="${chrome.i18n.getMessage(
		'hint_addtag'
	)}" type="text" class="tagadd"></div>`;

	// add the closing tag of footnote
	noteItemHTML += '</div>';

	// replace class names for setting styles
	if (noteItemHTML.match(/pinned|📌|tagDate/i)) {
		noteItemHTML = noteItemHTML.replace(/stackwrapper/gi, 'stackwrapper priority');
	}

	// add separator generator
	noteItemHTML += '<div class="sepGenerator hidden"></div>';

	// add the most outer closing tag
	noteItemHTML += '</div></div>';

	return noteItemHTML;
};

const generateSeparatorHTML = ({ id, type, content, footnote, date }) => {
	// add the most outer opening tag
	let separatorHTML = `<div class="${type}" id="${id}">`;

	// add body HTML
	separatorHTML += `<input class="separatorInput" type="text" value="${content}" placeholder="${chrome.i18n.getMessage(
		'hint_createseparator'
	)}" spellcheck="false">`;
	separatorHTML += `<i class="material-icons separatorCheckbox">check</i>`;

	// add tags to footnote
	separatorHTML += `<div class="footnote hidden">`;
	if (typeof footnote.tags !== 'undefined') {
		footnote.tags.forEach((tagName) => {
			separatorHTML += `<span class="tag">${tagName}</span>`;
		});
	}

	// add closing tags
	separatorHTML += '</div>';
	separatorHTML += '</div>';

	return separatorHTML;
};

/**
 * 	generate HTML for footnote tags
 *  classes are added for special tags
 */
const generateTagsHTML = (tagName) => {
	let tagsHTML = '';

	if (tagName.match(/pinned|📌/i)) {
		// pinned
		tagsHTML = `<span title="${chrome.i18n.getMessage(
			'hint_searchtag'
		)}" class="tag pinned emoji">${tagName}</span>`;
	} else if (tagName.match(/fav|★|☆|✭|⭐/i)) {
		// favourite
		// tagsHTML = `<span class="tag fav">${tagName}</span>`
		tagsHTML = `<span title="${chrome.i18n.getMessage('hint_searchtag')}"  class="tag fav">⭐</span>`;
	} else if (tagName.match(/like|♡|💛|♥|❤/i)) {
		// likes
		// tagsHTML = `<span class="tag like">${tagName}</span>`
		tagsHTML = `<span title="${chrome.i18n.getMessage('hint_searchtag')}"  class="tag like">❤</span>`;
	} else if (tagName.match(/\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu)) {
		// emoji
		tagsHTML = `<span title="${chrome.i18n.getMessage('hint_searchtag')}"  class="tag emoji">${tagName}</span>`;
	} else if (tagName === 'today') {
		tagsHTML = `<span title="${chrome.i18n.getMessage(
			'hint_searchtag'
		)}"  class="tag tagDate">${formatDate()}</span>`;
	} else if (!isNaN(new Date(tagName))) {
		// datetag
		tagsHTML = `<span title="${chrome.i18n.getMessage('hint_searchtag')}"  class="tag tagDate">${tagName}</span>`;
	} else {
		tagsHTML = `<span title="${chrome.i18n.getMessage('hint_searchtag')}"  class="tag">${tagName}</span>`;
	}

	// push the tag to stack if it has not yet
	if (!tagStack.find((t) => t.name === tagName)) {
		tagStack.push({ id: uuidv4(), name: tagName });
	}

	return tagsHTML;
};

const generateCurrentDateHTML = () => {
	// insert current time
	const now = new Date();
	const hours = ('0' + now.getHours()).slice(-2);
	const minutes = ('0' + now.getMinutes()).slice(-2);

	return `<div id="current" class="date current"><a title="${chrome.i18n.getMessage(
		'hint_jumpdate'
	)}" href="#">${formatDate() + ' ' + hours + ':' + minutes}</a></div>`;
};

const generateListItemHTML = (tag) => {
	const liItem = $(`<li id=${tag.id}><span>${tag.name}</span></li>`);

	// add class for emoji styles
	if (tag.name.match(/\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu)) {
		liItem.addClass('emoji');
	}

	// append editIcon to list item
	if (![ 'note', 'bookmark', 'clip' ].includes(tag.name)) {
		const editTagInput = $('<input>', {
			type: 'text',
			addClass: 'tageditInput tagadd',
			// value: tag,
			value: tag.name,
			placeholder: chrome.i18n.getMessage('hint_removetag'),

			spellCheck: 'false',
			css: {
				display: 'none'
			}
		});
		liItem.append(editTagInput);
		liItem.append(`<i title="${chrome.i18n.getMessage('hint_edittag')}" class="material-icons tagedit">edit</i>`);
	}

	return liItem;
};

// ========== Event attacher functions ==========
const attachEventsAndClassesToNotes = () => {
	// process DOMs after loaded
	$('.separator').each((index, item) => {
		item.classList.add('filtered');
		attachSeparatorEvents(item);
	});

	// attach events
	$('.stackwrapper').each((index, item) => {
		attachTagInputEvents(item);
		attachNoteContentEvents(item);
	});

	$('.sepGenerator').addClass('hidden');

	$('.current a').click((e) => {
		e.preventDefault();

		if (windowState.sortedByNew) {
			location.href = '#' + formatDate(new Date(dateStack[dateStack.length - 1]));
		}
	});

	$('.date a').click((e) => {
		e.preventDefault();
		let index = dateStack.findIndex((date) => formatDate(date) === $(e.target).parent().attr('id'));
		let nextDate = windowState.sortedByNew ? dateStack[index - 1] : dateStack[index + 1];

		if (windowState.sortedByNew) {
			if (index === 0) {
				// location.href = '#' + 'current';
				window.scrollTo(0, 0);
			} else {
				location.href = '#' + formatDate(new Date(nextDate));
				// window.scrollBy(0, -530);
			}
		} else {
			if ($(e.target).parent().hasClass('current')) {
				window.scrollTo(0, 0);
			} else {
				if (index === dateStack.length - 1) {
					// location.href = '#' + formatDate(new Date(dateStack[0]));
					location.href = '#' + 'current';
				} else {
					location.href = '#' + formatDate(new Date(nextDate));
				}
			}
		}
	});
};

const attachTagInputEvents = (stackWrapper) => {
	// BLUR event
	$(stackWrapper).find('.tagadd').blur((ev) => {
		ev.preventDefault();
		let tagName = ev.target.value.trim();
		if (tagName !== '') {
			// update tag information
			const index = stack.findIndex((item) => item.id === $(stackWrapper).attr('id'));

			if (typeof stack[index].footnote.tags === 'undefined') {
				stack[index].footnote.tags = [];
			}

			stack[index].footnote.tags.push(tagName);
			stackStorage.set(JSON.stringify(stack));

			// change the tag to emoji
			if (tagName.match(/pinned|📌/i)) {
				tagName = tagName.replace(/pinned/i, '📌');
				$(stackWrapper).addClass('priority');
			}

			let tagsHTML = generateTagsHTML(tagName);
			chrome.storage.local.set({ tagStack: tagStack });
			setDropdownListItems();

			// insert before tag input
			let divWrap = $(stackWrapper).find('.divWrap');
			divWrap.get(0).insertAdjacentHTML('beforebegin', tagsHTML);

			// reset value
			ev.target.value = '';

			// toggle divWrap visibility
			if ($(stackWrapper).find('.tag').length >= 4) {
				divWrap.addClass('hidden');
			} else {
				divWrap.removeClass('hidden');
			}

			// for search optimization
			if (shadowNodes[0]) {
				// remove the item from duplicated textstack as well
				$(shadowNodes[0]).find('.stackwrapper').each((index, item) => {
					if ($(item).attr('id') === $(stackWrapper).attr('id')) {
						let divWrap = $(item).find('.divWrap');
						divWrap.get(0).insertAdjacentHTML('beforebegin', tagsHTML);
						//
						if (tagName.match(/pinned|📌/i) || isNaN(tagName)) {
							$(item).addClass('priority');
						}
					}
				});
			}
		}
	});

	// KEYUP
	$(stackWrapper).find('.tagadd').keyup((ev) => {
		ev.stopPropagation();
		ev.preventDefault();

		let tagName = ev.target.value;

		if (tagName[tagName.length - 1] === ' ' || ev.keyCode === Keys.ENTER) {
			tagName = ev.target.value.trim();

			if (tagName !== '') {
				// update tag information
				const index = stack.findIndex((item) => item.id === $(stackWrapper).attr('id'));

				if (typeof stack[index].footnote.tags === 'undefined') {
					stack[index].footnote.tags = [];
				}

				stack[index].footnote.tags.push(tagName);
				stackStorage.set(JSON.stringify(stack));

				// change the tag to emoji
				if (tagName.match(/pinned|📌/i)) {
					tagName = tagName.replace(/pinned/i, '📌');
					$(stackWrapper).addClass('priority');
				}

				let tagsHTML = generateTagsHTML(tagName);
				chrome.storage.local.set({ tagStack: tagStack });
				setDropdownListItems();

				// insert before tag input
				let divWrap = $(stackWrapper).find('.divWrap');
				divWrap.get(0).insertAdjacentHTML('beforebegin', tagsHTML);

				// reset value
				ev.target.value = '';

				// toggle divWrap visibility
				if ($(stackWrapper).hasClass('clip')) {
					if ($(stackWrapper).find('.tag').length >= 3) {
						divWrap.addClass('hidden');
					} else {
						divWrap.removeClass('hidden');
					}
				} else {
					if ($(stackWrapper).find('.tag').length >= 4) {
						divWrap.addClass('hidden');
					} else {
						divWrap.removeClass('hidden');
					}
				}
				// for search optimization
				if (shadowNodes[0]) {
					// remove the item from duplicated textstack as well
					$(shadowNodes[0]).find('.stackwrapper').each((index, item) => {
						if ($(item).attr('id') === $(stackWrapper).attr('id')) {
							let divWrap = $(item).find('.divWrap');
							divWrap.get(0).insertAdjacentHTML('beforebegin', tagsHTML);
							if (tagName.match(/pinned|📌/i) || isNaN(tagName)) {
								$(item).addClass('priority');
							}
						}
					});
				}
			}
		} else if (ev.keyCode === Keys.BACKSPACE && tagName === '') {
			let tagInput = ev.target;
			let prevTag = $(tagInput).parent().prev();

			if ($(stackWrapper).find('.tag').length > 1) {
				// remove tag from footnote
				let prevTagName = prevTag.text();
				let prevStackWrapper = prevTag.parent().parent();

				// find the id of the previous tag
				let index = stack.findIndex((item) => item.id === $(prevStackWrapper).attr('id'));
				let tagIndex = stack[index].footnote.tags.indexOf(prevTagName);

				// remove the previous tag
				stack[index].footnote.tags.splice(tagIndex, 1);
				stackStorage.set(JSON.stringify(stack));
				prevTag.remove();

				// for search optimization
				if (shadowNodes[0]) {
					// remove the item from duplicated textstack as well
					$(shadowNodes[0]).find('.stackwrapper').each((index, item) => {
						if ($(item).attr('id') === $(prevStackWrapper).attr('id')) {
							$(item).find('.tag').each((index, tag) => {
								if ($(tag).text() === prevTagName) {
									$(tag).remove();
									if (prevTagName.match(/pinned|📌/i) || isNaN(prevTagName)) {
										$(item).removeClass('priority');
									}

									return false;
								}
							});
						}
					});
				}

				// remove the tag from tagStack if there is no item with the tag
				tagStack.splice(tagStack.findIndex((tag) => tag.name === prevTagName), 1);
				$('.tag').each((index, item) => {
					let tagRegex = new RegExp(`${escapeRegExp(prevTagName)}$`, 'i');

					if ($(item).text().match(tagRegex)) {
						// tagStack.push(prevTagName);
						tagStack.push({ id: uuidv4(), name: prevTagName });

						return false;
					}
				});
				chrome.storage.local.set({ tagStack: tagStack });
				setDropdownListItems();

				// remove pinned styles
				if (prevTagName.match(/pinned|📌/i)) {
					// $(stackWrapper).removeClass('pinned');
					$(stackWrapper).removeClass('priority');
					prevTag.removeClass('pinned');
				}
				// if (prevTagName.slice(1).match(/(fav|favourite|favorite)/i)) {
				if (prevTagName.match(/(★|☆|✭|⭐)/i)) {
					prevTag.removeClass('fav');
					// $(stackWrapper).removeClass('fav');
				}

				if (prevTagName.match(/(♡|💛|♥|❤)/i)) {
					prevTag.removeClass('like');
					// $(stackWrapper).removeClass('fav');
				}

				if (prevTagName.match(/(♡|💛|♥|❤)/i)) {
					prevTag.removeClass('like');
					// $(stackWrapper).removeClass('fav');
				}

				if (!isNaN(new Date(prevTagName))) {
					prevTag.removeClass('tagDate');
				}

				if (
					prevTagName.match(
						/\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu
					)
				) {
					prevTag.removeClass('emoji');
				}

				// set value
				$(tagInput).val(prevTagName);
				$(tagInput).trigger('focus');
			}
		}
	});
};

/**
 * 
 */
const attachNoteContentEvents = (wrapper) => {
	let contentDIV = wrapper.querySelector('.content');
	let prevHTML = wrapper.innerHTML;

	// add to wrapper
	wrapper.addEventListener('dblclick', (e) => {
		if (e.target.classList.contains('tagadd')) {
			return false;
		}
		if (e.target.classList.contains('sepGenerator')) {
			if (!e.target.classList.contains('hidden')) {
				createSeparator(wrapper);
				if (sortable !== null) {
					sortable.save();
				}
			}
			return false;
		}
		if (wrapper.classList.contains('note')) {
			// fire only when the area out of text body double clicked
			if (!e.target.classList.contains('content')) {
				// workaround for bubble control
				setTimeout(hideBubble, 30);
				setTimeout(() => {
					toggleEditorMode(contentDIV, true);
				}, 100);
			}
		}
	});

	if ($(wrapper).hasClass('clip bookmark')) {
		return false;
	}

	$(wrapper).find('.edit').click(() => {
		setTimeout(() => {
			toggleEditorMode(contentDIV, true);
		}, 100);
	});

	contentDIV.addEventListener('focus', (e) => {
		// remove html tags

		Array.from(contentDIV.childNodes).forEach((item) => {
			$(item).contents().unwrap();
		}, '');

		// insert decimal code as a zero-width space for displaying caret
		if (!contentDIV.innerHTML.match(String.fromCharCode(8203))) {
			contentDIV.innerHTML += '&#8203;';
		}

		// move caret to the end of the text
		const node = contentDIV.childNodes[contentDIV.childNodes.length - 1];
		const editorRange = document.createRange();
		const editorSel = window.getSelection();
		editorRange.setStart(node, node.length);
		editorRange.collapse(true);
		editorSel.removeAllRanges();
		editorSel.addRange(editorRange);
	});

	wrapper.addEventListener('mouseleave', (e) => {
		if ($(contentDIV).attr('contentEditable') === 'true') {
			toggleEditorMode(contentDIV, false);
		}
		return false;
	});

	contentDIV.addEventListener('focusout', clearMessage);

	// detect changes on content editable
	wrapper.addEventListener('blur', fireChange);
	wrapper.addEventListener('keyup', fireChange);
	wrapper.addEventListener('paste', fireChange);
	wrapper.addEventListener('copy', fireChange);
	wrapper.addEventListener('cut', fireChange);
	// wrapper.addEventListener('mouseup', fireChange);

	// fire div change event used for content change event
	wrapper.addEventListener('change', (e) => {
		if (!e.target.classList.contains('tagadd')) {
			let newHTML = contentDIV.innerHTML.replace(/<br>$/, '');
			updateStatusBoard(newHTML);

			// find note item index
			const id = $(e.target).attr('id');
			const index = stack.findIndex((item) => item.id === id);

			newHTML = $(contentDIV).unhighlight({ element: 'span', className: 'highlighted' }).html();

			// update note item
			stack[index].content = newHTML.replace(/<br>/gi, '\n');
			stackStorage.set(JSON.stringify(stack));

			// for search optimization
			if (shadowNodes[0]) {
				$(shadowNodes[0]).find('.stackwrapper').each((index, item) => {
					if ($(item).attr('id') === id) {
						item.innerHTML = wrapper.innerHTML;
						$(item).unhighlight({ element: 'span', className: 'highlighted' });
						return false;
					}
				});
			}
		}
	});

	// fire change event of content editable div when its content changed
	function fireChange(e) {
		const newHTML = wrapper.innerHTML;

		// replace with new HTML
		if (prevHTML !== newHTML) {
			wrapper.dispatchEvent(new Event('change'));
			prevHTML = newHTML;
		}

		// insert zero-width space when the text is empty
		if (contentDIV.innerHTML.length == 0) {
			contentDIV.innerHTML += '&#8203;';
		}
	}
};

const attachEventsToTextStack = () => {
	/**
 * the text stack dynamically changes
 */
	$('#textstack').click((e) => {
		let targetElem = e.target;
		let stackWrapper = $(e.target).parent().parent();

		// TAG
		if ($(targetElem).hasClass('tag')) {
			if (e.ctrlKey && $(targetElem).hasClass('removing')) {
				let tagName = $(targetElem).text();
				let stackWrapper = $(targetElem).parent().parent();

				// remove pinned styles
				if (tagName.match(/pinned|📌/i)) {
					// $(stackWrapper).removeClass('pinned');
					$(stackWrapper).removeClass('priority');
				}

				if (stackWrapper.find('.tag').length > 1 && $(targetElem).prev().length != 0) {
					// remove tag from footnote
					let id = stackWrapper.find('input').val();
					let index = stack.findIndex((item) => item.id === id);
					let tagIndex = stack[index].footnote.tags.indexOf(tagName);
					// remove the tag
					stack[index].footnote.tags.splice(tagIndex, 1);
					stackStorage.set(JSON.stringify(stack));

					// remove item in the UI
					$(targetElem).remove();

					// for search optimization
					if (shadowNodes[0]) {
						// remove the item from duplicated textstack as well
						$(shadowNodes[0]).find('.stackwrapper').each((index, item) => {
							if ($(item).attr('id') === id) {
								$(item).find('.tag').each((index, tag) => {
									if ($(tag).text() === tagName) {
										$(tag).remove();

										//
										if (tagName.match(/pinned|📌/i) || isNaN(tagName)) {
											$(item).removeClass('priority');
										}

										return false;
									}
								});
							}
						});
					}

					// TODO: change the logic
					// remove the tag from tagstack if there's no item with the tag
					// tagStack.splice(tagStack.findIndex((t) => t === tagName), 1);
					tagStack.splice(tagStack.findIndex((tag) => tag.name === tagName), 1);

					$('.tag').each((index, item) => {
						let tagRegex = new RegExp(`${escapeRegExp(tagName)}`, 'i');

						if ($(item).text().match(tagRegex)) {
							// tagStack.push(tagName);

							tagStack.push({ id: uuidv4(), name: tagName });

							return false;
						}
					});
					chrome.storage.local.set({ tagStack: tagStack });
					setDropdownListItems();

					stackWrapper.find('.footnote').find('.divWrap').removeClass('hidden');
				}
			} else {
				// TODO: fix lowering search query bug
				// when hashtag clicked
				if (!isNaN(Date.parse($(targetElem).html()))) {
					filterNoteItemsByTag(':d');

					$('.searchbox').val(':d');

					$('#statusboard').removeClass('entering');
				} else {
					fireSearch('#' + $(targetElem).html());
				}

				$('#statusboard').removeClass('entering');

				// stay at the position
				let stackWrapper = $(targetElem).parent().parent();
				let id = stackWrapper.find('input').val();
				let prevYOffset = window.pageYOffset;
				location.href = '#' + id;
				if (window.pageYOffset < window.offsetHeight) {
					window.scrollTo(0, 0);
				} else {
					window.scrollTo(0, prevYOffset);
				}
			}
			// CHECKBOX
		} else if ($(targetElem).hasClass('checkbox')) {
			// when checkbox clicked
			$(targetElem).css('color', 'white !important');
			let textItem = $(targetElem).parent().parent().parent().get(0);
			removeNoteItem(textItem);
			// save sort order
			if (sortable !== null) {
				sortable.save();
			}
			// PSEUDOLINK
		} else if ($(targetElem).hasClass('pseudolink')) {
			// use span tag as a link
			// open url in a background with Ctrl key
			chrome.tabs.create({
				url: $(targetElem).attr('href'),
				active: e.ctrlKey ? false : true
			});
			return false;
		}
	});

	$('#textstack').on({
		mouseover: (e) => {
			if ($(e.target).hasClass('tag')) {
				let stackWrapper = $(e.target).parent().parent();
				if ($(stackWrapper).find('.tag').length > 1 && !$(e.target).hasClass('type')) {
					if (e.ctrlKey && !$(e.target).hasClass('removing')) {
						$(e.target).addClass('removing');
					}
				}
			}
		},
		mouseout: (e) => {
			if ($(e.target).hasClass('tag')) {
				if (![ 'note', 'clip', 'bookmark' ].includes(e.target.textContent)) {
					$(e.target).removeClass('removing');
				}
			}
		}
	});
};

const attachSeparatorEvents = (stackwrapper) => {
	$(stackwrapper).find('.separatorInput').blur((ev) => {
		ev.preventDefault();

		let separatorName = ev.target.value;

		if (!separatorName.match(/^\s+$/)) {
			separatorName = ev.target.value.trim();

			// update tag information
			const index = stack.findIndex((item) => item.id === $(stackwrapper).attr('id'));

			if (typeof stack[index].content === 'undefined') {
				stack[index].content = '';
			}

			stack[index].content = separatorName;
			stackStorage.set(JSON.stringify(stack));
		} else {
			ev.target.value = ev.target.defaultValue;
		}

		ev.target.classList.add('disabled');
	});
	$(stackwrapper).find('.separatorInput').on('click', (ev) => {
		ev.target.classList.remove('disabled');
	});

	$(stackwrapper).find('.separatorCheckbox').on('click', (ev) => {
		let targetElem = ev.target;

		// when checkbox clicked
		$(targetElem).css('color', 'white !important');
		$(targetElem).parent().addClass('removed');

		setTimeout(() => {
			// remove tag from footnote
			let id = $(targetElem).parent().attr('id');
			stack = stack.filter((item) => item.id !== id);
			stackStorage.set(JSON.stringify(stack));
			// remove item in the UI
			$(targetElem).parent().remove();
		}, 450);
	});

	$(stackwrapper).find('.separatorInput').on('focus', (ev) => {
		ev.target.classList.remove('disabled');
	});

	// KEYUP
	$(stackwrapper).find('.separatorInput').keyup((ev) => {
		ev.preventDefault();

		let separatorName = ev.target.value;

		if (ev.keyCode === Keys.ENTER) {
			separatorName = ev.target.value.trim();

			if (separatorName !== '') {
				// update tag information
				const index = stack.findIndex((item) => item.id === $(stackwrapper).attr('id'));

				if (typeof stack[index].content === 'undefined') {
					stack[index].content = '';
				}

				stack[index].content = separatorName;
				stackStorage.set(JSON.stringify(stack));
				$(ev.target).trigger('blur');
			}
		}
	});
};

const attachListItemEvents = (liItem) => {
	// mouse events
	liItem.on({
		mouseover: (e) => {
			$(e.target).addClass('selected');
		},
		mouseleave: (e) => {
			$(e.target).removeClass('selected');
		},
		click: (e) => {
			if (e.target.classList.contains('tagedit')) {
				e.preventDefault();
				const liSelected = $(e.target).parent();

				const tagName = $(liSelected).find('.tageditInput').val();

				// turn on tageditInput
				$(e.target).hide();
				$(liSelected).find('span').hide();
				$(liSelected).find('.tageditInput').show();
				$(liSelected).find('.tageditInput').val(''); // to set caret at the end of text
				$(liSelected).find('.tageditInput').val(tagName);
				$(liSelected).find('.tageditInput').focus();

				return false;
			} else if (!e.target.classList.contains('tageditInput')) {
				fireSearch('#' + $(e.target).text().replace(/edit$/, ''));
				hideDropdownList();
			}
		}
	});

	// keyboard events
	$('.tageditInput').keyup((e) => {
		if (e.keyCode === Keys.ENTER) {
			let newTag = e.target.value;
			let oldTag = e.target.defaultValue;

			if (newTag === '') {
				// remove the tag from tagstack
				$('.tag').each((index, elem) => {
					if ($(elem).text() === oldTag) {
						$(elem).remove();
					}
				});
				tagStack.splice(tagStack.findIndex((t) => t.name === oldTag), 1);
				chrome.storage.local.set({ tagStack: tagStack });

				// remove the tag from stack
				stack.forEach((item) => {
					if (item.footnote.tags.includes(oldTag)) {
						item.footnote.tags.splice(item.footnote.tags.findIndex((t) => t.name === oldTag), 1);
					}
				});
				stackStorage.set(JSON.stringify(stack));

				// remove the tag from shadow nodes for search optimization
				if (shadowNodes[0]) {
					$(shadowNodes[0]).find('.tag').each((index, elem) => {
						if ($(elem).text() === oldTag) {
							$(elem).remove();
						}
					});
				}
				// remove the tag DOM
				$(e.target).parent().remove();
			} else {
				// update the tag
				if (newTag.match(/^\s*$/)) {
					// cancel tag edit
					newTag = oldTag;
				} else {
					replaceTagName(oldTag, newTag);

					// replace all the tags in the textstack
					$('.tag').each((index, elem) => {
						if ($(elem).text() === oldTag) {
							$(elem).text(newTag);
						}
					});

					// update tagstack
					if (tagStack.findIndex((t) => t.name === newTag) === -1) {
						tagStack.find((t) => t.name === oldTag).name = newTag;
					} else {
						tagStack.splice(tagStack.findIndex((t) => t.name === oldTag), 1);
					}
					chrome.storage.local.set({ tagStack: tagStack });

					e.target.defaultValue = newTag;

					// turn off tageditInput
					$(e.target).parent().find('span').text(newTag);
					$(e.target).parent().find('span').show();
					$(e.target).parent().find('.tagedit').show();
					$(e.target).hide();
					//
					tagSortable.save();

					// replace tags of shadow nodes for search optimization
					if (shadowNodes[0]) {
						$(shadowNodes[0]).find('.tag').each((index, elem) => {
							if ($(elem).text() === oldTag) {
								$(elem).text(newTag);
							}
						});
					}

					// update search query as well
					if ($('.searchbox').val() !== '') {
						$('.searchbox').val('#' + newTag);
						windowState.searchQuery = '#' + newTag;
						fireSearch('#' + newTag);
					}
				}
			}
			// setDropdownListItems();
		}
	});

	$('.tageditInput').blur((e) => {
		// cancel tag edit
		const oldTag = e.target.defaultValue;
		e.target.value = oldTag;
		// turn off tageditInput
		$(e.target).parent().find('span').text(oldTag);
		$(e.target).parent().find('span').show();
		$(e.target).parent().find('.tagedit').show();
		$(e.target).hide();
	});
};

// ========== Initializer ==========
const initializeEventListeners = () => {
	/**
   * window events
   */

	window.onscroll = (e) => {
		// show header and footer when scrolling to the top/bottom
		if (window.pageYOffset == 0) {
			$('header').css('opacity', 1);
			$('footer').show();
		} else if ($('body').offsetHeight + window.scrollY >= $('body').scrollHeight) {
			$('header').css('opacity', 1);
			$('footer').hide();
		} else {
			$('header').css('opacity', 0);
			$('footer').fadeOut(100);
		}

		// save scrollY position
		windowState.scrollY = window.scrollY;
	};

	window.onload = function() {
		setTimeout(() => {
			document.body.addEventListener('drag', (e) => {
				if (e.clientY > 650) {
					window.scrollBy(0, 75);
				} else if (e.clientY > 550) {
					window.scrollBy(0, 35);
				} else if (e.clientY < 100) {
					window.scrollBy(0, -35);
				} else if (e.clientY < 50) {
					window.scrollBy(0, -75);
				}
			});

			setTagAddAutoComplete($('#textstack .tagadd'));
		}, 100);
	};

	// save window state when the popup window is closed
	$(window).on('unload blur', () => {
		windowState.closedDateTime = new Date().toISOString();
		background.chrome.storage.local.set(windowState);
	});

	window.addEventListener('keyup', (e) => {
		if (e.ctrlKey && e.keyCode === Keys.ENTER) {
			// when another tag is on focus
			if ($('.tagadd, .separatorInput').is(':focus')) {
				return false;
			}
			// create a note / focus on the note
			const noteInEdit = $('[contenteditable=true]').get(0);
			if (noteInEdit) {
				toggleEditorMode(noteInEdit, false);
				return false;
			} else {
				createNoteItem();

				// save sort order
				if (sortable !== null) {
					sortable.save();
				}

				const newNote = windowState.sortedByNew ? $('.content').first() : $('.content').last();
				toggleEditorMode(newNote, true);
				return false;
			}
		}
	});

	/* dropdown list */
	$('#tagsearch-result, header').on('mouseleave', hideDropdownList);

	/* searchbox  */
	$('.searchbox').on({
		click: hideDropdownList,
		dblclick: showDropdownList,
		keydown: selectOnDropdownList,
		input: () => {
			const query = $('.searchbox').val();
			const queryLength = query.length;

			if (query[0] === '#' && queryLength > 1) {
				// create SortableJS instance
				sortable = Sortable.create(document.querySelector('#textstack'), {
					sort: true,
					delay: 150,
					animation: 150,
					dataIdAttr: 'id',
					filter: '.date',
					group: query.substring(1),
					store: {
						get: (sortable) => {
							let str = localStorage.getItem(sortable.options.group.name);
							if (str) {
								sortableState = JSON.parse(str);
								let order = sortableState.order ? sortableState.order.split('|') : [];
								if (windowState.sortedByNew !== sortableState.sortedByNew) {
									order.reverse();
								}
								return order;
							} else {
								return [];
							}
						},
						set: (sortable) => {
							let order = sortable.toArray();
							let sortableState = {
								sortedByNew: windowState.sortedByNew,
								order: order.join('|')
							};
							localStorage.setItem(sortable.options.group.name, JSON.stringify(sortableState));
						}
					}
				});
			}

			// change wait time for starting search
			let waittime = 0;

			switch (queryLength) {
				case 0:
					waittime = 1;
					break;
				case 1:
					waittime = 500;
					break;
				case 2:
					waittime = 400;
					break;
				case 3:
					waittime = 300;
					break;
				case 4:
					waittime = 100;
					break;
				default:
					waittime = 50;
			}

			// optimization for reset search
			if (queryLength > 0 || $('#textstack').hasClass('viewmode')) {
				$('#sort .sortText').hide();
				$('html').removeClass('smoothscroll');
				doAfterInputIsDone(updateSearchResult, waittime);
			} else {
				$('html').addClass('smoothscroll');

				$('#sort .sortText').show();

				// reset task
				doAfterInputIsDone.TID = {};

				// replace textstack with shadow nodes
				$('#textstack').remove();
				document.querySelector('#main').insertAdjacentElement('beforeend', shadowNodes[0]);

				setTagAddAutoComplete($('#textstack .tagadd'));

				// reset SortableJS instance
				if (sortable) {
					sortable = null;
				}

				stackDOM = document.querySelector('#textstack');

				// atach eventes
				attachEventsToTextStack();

				attachEventsAndClassesToNotes();

				$('.textstack').removeClass('infilter');

				// reset shadow nodes;
				shadowNodes.length = 0;
				shadowNodes.push(document.querySelector('#textstack').cloneNode(true));

				// show toolbox
				clearMessage();
				$('.search-cancel-button').hide();
				$('footer').show();
				hideDropdownList();

				// reset state
				windowState.searchQuery = '';
			}
		}
	});

	/* search cancel button */
	$('.search-cancel-button').click((e) => {
		fireSearch('');
		$('.searchbox').trigger('focus');
	});

	/* toolbox & text area */
	$('.create').click(() => {
		createNoteItem();

		// save sort order
		if (sortable !== null) {
			sortable.save();
		}

		const newNote = windowState.sortedByNew ? $('.content').first() : $('.content').last();
		toggleEditorMode(newNote, true);
	});

	/* view mode */
	$('.view').click((e) => {
		if ($('#textstack').hasClass('viewmode')) {
			$('#textstack').removeClass('viewmode');
			$('#toolbox').removeClass('viewmode');
			$('.view').removeClass('viewmode');
			$(e.target).attr('title', chrome.i18n.getMessage('hint_showimportant'));
			fireSearch('');
		} else {
			fireSearch('');
			$('.view').addClass('viewmode');
			$('#textstack').addClass('viewmode');
			$('#toolbox').addClass('viewmode');
			$(e.target).attr('title', chrome.i18n.getMessage('hint_showimportant'));
			$(e.target).attr('title', chrome.i18n.getMessage('hint_showallnotes'));
		}
	});

	/* file export */
	$('.export').click(() => {
		toggleFileExportModal(true);
	});

	$('#statusboard').click(clearMessage);

	$('#sort').click(() => {
		toggleSortOrder(!windowState.sortedByNew);
	});

	// footer
	$('#clearstack').click(() => {
		toggleClearStackModal(true);
	});

	$('#clearstack-window .overlay').click(() => {
		toggleClearStackModal(false);
	});

	$('#clearstack-window .ok').click(() => {
		clearAllItems();
		toggleClearStackModal(false);
	});

	$('#clearstack-window .cancel').click(() => {
		toggleClearStackModal(false);
	});

	// modal window
	$('#fileexport-window .overlay').click(() => {
		toggleFileExportModal(false);
	});

	$('#fileexport-window .ok').click((e) => {
		exportStack($(':checked').val());
		toggleFileExportModal(false);
	});

	$('#fileexport-window .cancel').click(() => {
		toggleFileExportModal(false);
	});
};

// ========== STORAGE ==========
const createNoteItem = () => {
	const note = {
		id: uuidv4(),
		type: 'note',
		content: '',
		footnote: {
			tags: [],
			pageTitle: '',
			pageURL: ''
		},
		// date: formatDate()
		date: new Date().toISOString()
	};

	// add the current tag in the seachbox to the new note
	// const searchQuery = windowState.searchQuery;
	const searchQuery = $('.searchbox').val();
	if (searchQuery[0] === '#' && searchQuery.length > 0) {
		note.footnote.tags.push(searchQuery.substring(1));
	}

	// add an empty note to stack
	stack.push(note);
	stackStorage.set(JSON.stringify(stack));

	// attach events
	const wrapper = $(generateNoteItemHTML(note)).get(0);
	attachTagInputEvents(wrapper);
	attachNoteContentEvents(wrapper);

	// render
	if (windowState.sortedByNew) {
		$('#textstack').prepend(wrapper);
		setTagAddAutoComplete($('#textstack .tagadd').first());
	} else {
		$('#textstack').append(wrapper);
		setTagAddAutoComplete($('#textstack .tagadd').last());
	}

	// clone for search optimization
	if (shadowNodes[0]) {
		const shadowWrapper = $(generateNoteItemHTML(note)).get(0);
		attachTagInputEvents(shadowWrapper);
		attachNoteContentEvents(shadowWrapper);
		if (windowState.sortedByNew) {
			$(shadowNodes[0]).prepend(shadowWrapper);
		} else {
			$(shadowNodes[0]).append(shadowWrapper);
		}
	}
};

const removeNoteItem = (noteItem) => {
	// apply visual effects and display message
	noteItem.classList.add('removed');
	displayMessage(chrome.i18n.getMessage('msg_itemremoved'));

	// remove from stack and storage after a while
	setTimeout(() => {
		const id = noteItem.querySelector('input').value;
		const idx = stack.findIndex((item) => item.id === id);
		const tagsToRemove = stack[idx].footnote.tags;
		// remove from storage
		stack = stack.filter((item) => item.id !== id);
		stackStorage.set(JSON.stringify(stack));
		// remove from textstack
		noteItem.remove();

		let noTag = true;
		tagsToRemove.forEach((tagName) => {
			$('.tag').each((index, item) => {
				const tagRegex = new RegExp(`${escapeRegExp(tagName)}`, 'i');
				if ($(item).text().match(tagRegex)) {
					noTag = false;
					return;
				}
			});
			// remove the tag from tagstack if no other notes have the tag
			if (noTag) {
				tagStack.splice(tagStack.findIndex((t) => t.name === tagName), 1);
				noTag = true;
			}
		});

		// show toolbox
		clearMessage();

		// reset dropdownlist
		chrome.storage.local.set({ tagStack: tagStack });
		setDropdownListItems();

		// for search optimization
		if (shadowNodes[0]) {
			// remove the item from duplicated textstack as well
			$(shadowNodes[0]).find('.stackwrapper').each((index, item) => {
				if ($(item).attr('id') === id) {
					$(item).remove();
					return false;
				}
			});
		}
	}, 450);
};

const createSeparator = (wrapper) => {
	const query = $('.searchbox').val();

	if (query[0] === '#' && query.substring(1) !== '') {
		// add separator to stack
		const separator = {
			id: uuidv4(),
			type: 'separator',
			content: '',
			footnote: {
				tags: [ query ],
				pageTitle: '',
				pageURL: ''
			},
			date: new Date().toISOString()
		};
		stack.push(separator);
		stackStorage.set(JSON.stringify(stack));

		// render the separator
		const separatorDOM = $(generateSeparatorHTML(separator)).get(0);
		$(separatorDOM).insertAfter(wrapper);
		$(separatorDOM).find('input').focus();

		attachSeparatorEvents(separatorDOM);
	}
};

const clearAllItems = () => {
	// clear storage
	stackStorage.reset();

	// reset the form
	$('.searchbox').val('');
	$('#textstack').empty();
	$('#textstack').append($(generateCurrentDateHTML()));

	// reset state variables
	stack = [];
	tagStack = [
		{
			id: uuidv4(),
			name: 'bookmark'
		},
		{
			id: uuidv4(),
			name: 'clip'
		},
		{
			id: uuidv4(),
			name: 'note'
		}
	];
	chrome.storage.local.set({ tagStack: tagStack });

	windowState = {
		searchQuery: '',
		scrollY: 0,
		sortedByNew: true
	};

	$('.search-cancel-button').hide();
	shadowNodes.length = 0;
	shadowNodes.push(document.querySelector('#textstack').cloneNode(true));
};

/**
 * render text stack
 */
const renderStack = () => {
	// remove all text items
	$('#textstack').empty();

	// read from storage
	stackStorage.get((raw) => {
		if (typeof raw === 'undefined') {
			stackStorage.reset();
		} else {
			// read and sort stack by date
			stack = JSON.parse(raw);
			stack.sort((a, b) => {
				a = new Date(a.date);
				b = new Date(b.date);
				// OLD => NEW
				return a > b ? 1 : a < b ? -1 : 0;
			});

			let notesHTML = '';

			// generate HTML and insert
			stack.forEach((res, index) => {
				const date = new Date(res.date);
				const id = res.id;
				// insert date between items
				if (index === 0) {
					notesHTML =
						`<div id="${formatDate(date)}" class="date"><a title="${chrome.i18n.getMessage(
							'hint_jumpdate'
						)}" href="#current">${formatDate(date)}</a></div>` + notesHTML;
					dateStack.push(date);
				} else {
					if (!isNaN(date)) {
						let dateStr = formatDate(new Date(dateStack[dateStack.length - 1]));
						if (dateStr !== formatDate(date)) {
							// notesHTML = `<div class="date">${formatDate(date)}</div>` + notesHTML;
							notesHTML =
								`<div id="${formatDate(date)}" class="date"><a title="${chrome.i18n.getMessage(
									'hint_jumpdate'
								)}" href="#">${formatDate(date)}</a></div>` + notesHTML;
							dateStack.push(date);
						}
					}
				}
				// generate note/separator items
				if (res.type === 'separator') {
					notesHTML = generateSeparatorHTML(res) + notesHTML;
				} else {
					notesHTML = generateNoteItemHTML(res) + notesHTML;
				}
			});
			notesHTML = generateCurrentDateHTML() + notesHTML;

			document.querySelector('#textstack').insertAdjacentHTML('afterbegin', notesHTML);

			// clone the current stack for search optimization
			shadowNodes.push(document.querySelector('#textstack').cloneNode(true));

			//
			attachEventsAndClassesToNotes();
			setDropdownListItems();
			attachEventsToTextStack();
		}
	});
};

/**
 * restore the window state of last time popup.html was opened
 */
const restorePreviousState = () => {
	const CACHE_DURATION = options.duration * 1000;

	chrome.storage.local.get([ 'searchQuery', 'scrollY', 'closedDateTime', 'sortedByNew' ], (state) => {
		windowState = state;

		const timeElapsed =
			typeof state.closedDateTime !== 'undefined' ? new Date() - new Date(state.closedDateTime) : CACHE_DURATION;

		if (timeElapsed < CACHE_DURATION) {
			// restore searchbox
			if (typeof state.searchQuery !== 'undefined') {
				if (state.searchQuery !== '') {
					fireSearch(state.searchQuery);
				}
			}
			// restore sort order
			if (typeof state.sortedByNew === 'undefined') {
				windowState.sortedByNew = true;
			} else {
				windowState.sortedByNew = state.sortedByNew;
				if (!windowState.sortedByNew) {
					$('#sort').html(
						`<span class="sortText">Old </span><i title="${chrome.i18n.getMessage(
							'hint_toggleorder'
						)}" class="material-icons">arrow_downward</i>`
					);
					if (sortable !== null) {
						$(shadowNodes[0]).children().each(function(i, wrapper) {
							$(shadowNodes[0]).prepend(wrapper);
						});

						sortable.sort(sortable.toArray());
						sortable.save();
					} else {
						reverseStack();
					}
				}
			}

			setTimeout(() => {
				// restore scrollY
				if (typeof state.scrollY !== 'undefined') {
					if (state.searchQuery !== '') {
						$('html').removeClass('smoothscroll');
					} else {
						$('html').addClass('smoothscroll');
					}
					window.scrollTo(0, state.scrollY);
				}
			}, 50);
		} else {
			windowState = {
				searchQuery: '',
				scrollY: 0,
				sortedByNew: true,
				closedDateTime: new Date().toISOString()
			};
		}
	});
};

const reverseStack = () => {
	let textStack = $('#textstack'); // your parent ul element
	textStack.children().each(function(i, wrapper) {
		textStack.prepend(wrapper);
	});

	$(shadowNodes[0]).children().each(function(i, wrapper) {
		$(shadowNodes[0]).prepend(wrapper);
	});
};

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
	localizeHtmlPage();

	chrome.storage.local.get('tagStack', (res) => {
		if (typeof res.tagStack === 'undefined' || res.tagStack.length === 0) {
			tagStack = [
				{
					id: uuidv4(),
					name: 'bookmark'
				},
				{
					id: uuidv4(),
					name: 'clip'
				},
				{
					id: uuidv4(),
					name: 'note'
				}
			];
			chrome.storage.local.set({ tagStack: tagStack });
		} else {
			tagStack = res.tagStack;
		}
	});

	initializeEventListeners();

	renderStack();

	chrome.storage.sync.get([ 'options' ], (res) => {
		if (typeof res.options === 'undefined') {
			options = preset;
		} else {
			options = res.options;
		}
		if (options.restoreEnabled) {
			restorePreviousState();
		}
	});
});
