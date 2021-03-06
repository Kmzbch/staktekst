const defaultSettings = {
	restoreEnabled: true,
	duration: 30,
	zoominPercentage: 150,
	balloonMenuEnabled: true,
	contextMenuEnabled: false,
	searchEngines: [
		{
			id: 'search1',
			title: chrome.i18n.getMessage('se_google'),
			url:
				chrome.i18n.getMessage('html_lang') === 'ja'
					? 'https://www.google.co.jp/search?hl=ja&q=%s'
					: `https://www.google.com/search?hl=${window.navigator.language}&q=%s`,

			contexts: [ 'selection' ],
			class: 'mdi mdi-magnify'
		},
		{
			id: 'search2',
			title: chrome.i18n.getMessage('se_vocabulary'),
			url: 'https://www.vocabulary.com/dictionary/%s',
			contexts: [ 'selection' ],
			class: 'mdi mdi-check'
		},
		{
			id: 'search3',

			title: chrome.i18n.getMessage('se_doppl'),
			url: 'https://dopeoplesay.com/q/%s',
			contexts: [ 'selection' ],
			class: 'mdi mdi-account-multiple'
		},
		{
			id: 'search4',
			title: chrome.i18n.getMessage('se_skell'),
			url: 'https://skell.sketchengine.co.uk/run.cgi/concordance?lpos=&query=%s',
			contexts: [ 'selection' ],
			class: 'mdi mdi-format-list-numbered'
		},
		{
			id: 'search5',

			title: chrome.i18n.getMessage('se_netspeak'),
			url: 'https://netspeak.org/#q=%s&corpus=web-en',
			contexts: [ 'selection' ],
			class: 'mdi mdi-chart-histogram'
		},

		{
			id: 'search6',
			title: chrome.i18n.getMessage('se_youglish'),
			url: 'https://youglish.com/search/%s',
			contexts: [ 'selection' ],
			class: 'mdi mdi-youtube'
		},
		{
			id: 'search7',
			title: chrome.i18n.getMessage('se_deepl'),
			url:
				'https://www.deepl.com/translator#en/' +
				(window.navigator.language || chrome.i18n.getMessage('html_lang')) +
				'/%s',
			contexts: [ 'selection' ],
			class: 'mdi mdi-translate'
		},
		{
			id: 'search8',
			title: chrome.i18n.getMessage('se_googletranslate'),
			url:
				'https://translate.google.com/?hl=' +
				(window.navigator.language || chrome.i18n.getMessage('html_lang')) +
				'#view=home&op=translate&sl=auto&tl=' +
				(window.navigator.language || chrome.i18n.getMessage('html_lang')) +
				'&text=%s',
			contexts: [ 'selection' ],
			class: 'mdi mdi-text-to-speech'
		}
	]
};

// state variables
let iconToChange;
let options = {};

const initializeElements = () => {
	// load options
	chrome.storage.local.get([ 'options' ], (res) => {
		options = typeof res.options === 'undefined' ? defaultSettings : res.options;

		$('#restore').prop('checked', options.restoreEnabled);

		if ($('#restore').prop('checked') === true) {
			$('#duration').prop('disabled', false);
		} else {
			$('#duration').prop('disabled', true);
		}
		$('#zoominPercentage').val(options.zoominPercentage);
		$('#duration').val(options.duration);

		$('#balloon').prop('checked', options.balloonMenuEnabled);
		$('#context').prop('checked', options.contextMenuEnabled);

		$('#engine1_icon').attr('class', options.searchEngines[0].class);
		$('#engine1_name').val(options.searchEngines[0].title);
		$('#engine1_url').val(options.searchEngines[0].url);

		$('#engine2_icon').attr('class', options.searchEngines[1].class);
		$('#engine2_name').val(options.searchEngines[1].title);
		$('#engine2_url').val(options.searchEngines[1].url);

		$('#engine3_icon').attr('class', options.searchEngines[2].class);
		$('#engine3_name').val(options.searchEngines[2].title);
		$('#engine3_url').val(options.searchEngines[2].url);

		$('#engine4_icon').attr('class', options.searchEngines[3].class);
		$('#engine4_name').val(options.searchEngines[3].title);
		$('#engine4_url').val(options.searchEngines[3].url);

		$('#engine5_icon').attr('class', options.searchEngines[4].class);
		$('#engine5_name').val(options.searchEngines[4].title);
		$('#engine5_url').val(options.searchEngines[4].url);

		$('#engine6_icon').attr('class', options.searchEngines[5].class);
		$('#engine6_name').val(options.searchEngines[5].title);
		$('#engine6_url').val(options.searchEngines[5].url);

		$('#engine7_icon').attr('class', options.searchEngines[6].class);
		$('#engine7_name').val(options.searchEngines[6].title);
		$('#engine7_url').val(options.searchEngines[6].url);

		$('#engine8_icon').attr('class', options.searchEngines[7].class);
		$('#engine8_name').val(options.searchEngines[7].title);
		$('#engine8_url').val(options.searchEngines[7].url);
	});
};

const initializeEvents = () => {
	$(
		'#engine1_name, #engine2_name, #engine3_name, #engine4_name, #engine5_name, #engine6_name, #engine7_name, #engine8_name'
	).on({
		change: (e) => {
			let name = e.target.value;
			if (name.match(/^[a-zA-Z]/)) {
				let icon = $(e.target).parent().find('i');
				icon.removeClass();
				icon.addClass(`mdi mdi-alpha-${name[0].toLowerCase()}-box`);
			}
		}
	});

	$('#restore').click((e) => {
		if ($('#restore').prop('checked') === true) {
			$('#duration').prop('disabled', false);
		} else {
			$('#duration').prop('disabled', true);
		}
	});

	// toggle icon Selection window
	$('.form-group i').click((e) => {
		iconToChange = e.target;
		if ($('#iconselection').hasClass('hidden')) {
			const top = $(e.target).offset().top;
			const left = $(e.target).offset().left;
			$('#iconselection').offset({ top: top + 35, left: left });
			$('#iconselection').removeClass('hidden');
		} else {
			$('#iconselection').offset({ top: 0, left: 0 });
			$('#iconselection').addClass('hidden');
		}
	});

	$('#iconselection i').click((e) => {
		const newIcon = e.target;
		// change with the selected icon
		$(iconToChange).removeClass();
		$(iconToChange).addClass($(newIcon).attr('class'));
		// close icon selection window
		$(iconToChange).trigger('click');
	});

	$('#save').click((e) => {
		options = {
			restoreEnabled: $('#restore').prop('checked'),
			duration: $('#duration').val(),
			zoominPercentage: $('#zoominPercentage').val(),
			balloonMenuEnabled: $('#balloon').prop('checked'),
			contextMenuEnabled: $('#context').prop('checked'),
			searchEngines: [
				{
					id: 'search1',
					class: $('#engine1_icon').attr('class'),
					title: $('#engine1_name').val(),
					contexts: [ 'selection' ],
					url: $('#engine1_url').val()
				},
				{
					id: 'search2',
					class: $('#engine2_icon').attr('class'),
					title: $('#engine2_name').val(),
					contexts: [ 'selection' ],
					url: $('#engine2_url').val()
				},
				{
					id: 'search3',
					class: $('#engine3_icon').attr('class'),
					title: $('#engine3_name').val(),
					contexts: [ 'selection' ],
					url: $('#engine3_url').val()
				},
				{
					id: 'search4',
					class: $('#engine4_icon').attr('class'),
					title: $('#engine4_name').val(),
					contexts: [ 'selection' ],
					url: $('#engine4_url').val()
				},
				{
					id: 'search5',
					class: $('#engine5_icon').attr('class'),
					title: $('#engine5_name').val(),
					contexts: [ 'selection' ],
					url: $('#engine5_url').val()
				},
				{
					id: 'search6',
					class: $('#engine6_icon').attr('class'),
					title: $('#engine6_name').val(),
					contexts: [ 'selection' ],
					url: $('#engine6_url').val()
				},
				{
					id: 'search7',
					class: $('#engine7_icon').attr('class'),
					title: $('#engine7_name').val(),
					contexts: [ 'selection' ],
					url: $('#engine7_url').val()
				},
				{
					id: 'search8',
					class: $('#engine8_icon').attr('class'),
					title: $('#engine8_name').val(),
					contexts: [ 'selection' ],
					url: $('#engine8_url').val()
				}
			]
		};

		// save options
		chrome.storage.local.set({ options: options }, () => {
			// send to background.js to reflect the change
			chrome.runtime.sendMessage(
				{
					command: 'OPTIONS'
				},
				(response) => {
					console.log('options changed!');
				}
			);
		});
	});

	// reset to default
	$('#reset').click((e) => {
		chrome.storage.local.set({ options: defaultSettings });
	});
};

// initialization
localizeHtmlPage();
initializeElements();
initializeEvents();
