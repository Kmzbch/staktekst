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
			url: 'https://encrypted.google.com/search?hl=en&gl=en&q=%s',
			class: 'mdi mdi-magnify'
		},
		{
			id: 'search2',
			title: chrome.i18n.getMessage('se_vocabulary'),
			url: 'https://www.vocabulary.com/dictionary/%s',
			class: 'mdi mdi-check'
		},
		{
			id: 'search3',

			title: chrome.i18n.getMessage('se_doppl'),
			url: 'https://dopeoplesay.com/q/%s',
			class: 'mdi mdi-account-multiple'
		},
		{
			id: 'search4',
			title: chrome.i18n.getMessage('se_skell'),
			url: 'https://skell.sketchengine.co.uk/run.cgi/concordance?lpos=&query=%s',
			class: 'mdi mdi-format-list-numbered'
		},
		{
			id: 'search5',

			title: chrome.i18n.getMessage('se_netspeak'),
			url: 'https://netspeak.org/#q=%s&corpus=web-en',
			class: 'mdi mdi-chart-histogram'
		},

		{
			id: 'search6',
			title: chrome.i18n.getMessage('se_youglish'),
			url: 'https://youglish.com/search/%s',
			class: 'mdi mdi-youtube'
		}
	]
};

// state variables
let iconToChange;
let options = {};

const initializeElements = () => {
	// load options
	chrome.storage.sync.get([ 'options' ], (res) => {
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
	});
};

const initializeEvents = () => {
	$('#engine1_name, #engine2_name, #engine3_name, #engine4_name, #engine5_name, #engine6_name').on({
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
					url: $('#engine1_url').val()
				},
				{
					id: 'search2',
					class: $('#engine2_icon').attr('class'),
					title: $('#engine2_name').val(),
					url: $('#engine2_url').val()
				},
				{
					id: 'search3',
					class: $('#engine3_icon').attr('class'),
					title: $('#engine3_name').val(),
					url: $('#engine3_url').val()
				},
				{
					id: 'search4',
					class: $('#engine4_icon').attr('class'),
					title: $('#engine4_name').val(),
					url: $('#engine4_url').val()
				},
				{
					id: 'search5',
					class: $('#engine5_icon').attr('class'),
					title: $('#engine5_name').val(),
					url: $('#engine5_url').val()
				},
				{
					id: 'search6',
					class: $('#engine6_icon').attr('class'),
					title: $('#engine6_name').val(),
					url: $('#engine6_url').val()
				}
			]
		};

		// save options
		chrome.storage.sync.set({ options: options }, () => {
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
		chrome.storage.sync.set({ options: defaultSettings });
	});
};

// initialization
localizeHtmlPage();
initializeElements();
initializeEvents();
