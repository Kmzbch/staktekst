const preset = {
	restoreEnabled: true,
	duration: 30,
	balloonMenuEnabled: true,
	contextMenuEnabled: false,
	searchEngines: [
		{
			id: 'search1',
			name: chrome.i18n.getMessage('se_google'),
			url: 'https://encrypted.google.com/search?hl=en&gl=en&q=%s',
			icon: {
				class: 'mdi mdi-magnify',
				text: ''
			}
		},
		{
			id: 'search2',
			name: chrome.i18n.getMessage('se_vocabulary'),
			url: 'https://www.vocabulary.com/dictionary/%s',
			icon: {
				class: 'mdi mdi-check',
				text: ''
			}
		},
		{
			id: 'search3',

			name: chrome.i18n.getMessage('se_doppl'),
			url: 'https://dopeoplesay.com/q/%s',
			icon: {
				class: 'mdi mdi-account-multiple',
				text: ''
			}
		},
		{
			id: 'search4',
			name: chrome.i18n.getMessage('se_skell'),
			url: 'https://skell.sketchengine.co.uk/run.cgi/concordance?lpos=&query=%s',
			icon: {
				class: 'mdi mdi-alpha-s-box',
				text: ''
			}
		},
		{
			id: 'search5',

			name: chrome.i18n.getMessage('se_netspeak'),
			url: 'https://netspeak.org/#q=%s&corpus=web-en',
			icon: {
				class: 'mdi mdi-alpha-n-box',
				text: ''
			}
		},

		{
			id: 'search6',
			name: chrome.i18n.getMessage('se_youglish'),
			url: 'https://youglish.com/search/%s',
			icon: {
				class: 'mdi mdi-youtube',
				text: ''
			}
		}
	]
};

// state variables
let oldIcon;
let options = {};

const initializeElements = () => {
	// load options
	chrome.storage.sync.get([ 'options' ], (res) => {
		options = typeof res.options === 'undefined' ? preset : res.options;

		$('#restore').prop('checked', options.restoreEnabled);

		if ($('#restore').prop('checked') === true) {
			$('#duration').prop('disabled', false);
		} else {
			$('#duration').prop('disabled', true);
		}
		$('#duration').val(options.duration);

		$('#balloon').prop('checked', options.balloonMenuEnabled);
		$('#context').prop('checked', options.contextMenuEnabled);

		$('#engine1_icon').attr('class', options.searchEngines[0].icon.class);
		$('#engine1_icon').text(options.searchEngines[0].icon.text);
		$('#engine1_name').val(options.searchEngines[0].name);
		$('#engine1_url').val(options.searchEngines[0].url);

		$('#engine2_icon').attr('class', options.searchEngines[1].icon.class);
		$('#engine2_icon').text(options.searchEngines[1].icon.text);
		$('#engine2_name').val(options.searchEngines[1].name);
		$('#engine2_url').val(options.searchEngines[1].url);

		$('#engine3_icon').attr('class', options.searchEngines[2].icon.class);
		$('#engine3_icon').text(options.searchEngines[2].icon.text);
		$('#engine3_name').val(options.searchEngines[2].name);
		$('#engine3_url').val(options.searchEngines[2].url);

		$('#engine4_icon').attr('class', options.searchEngines[3].icon.class);
		$('#engine4_icon').text(options.searchEngines[3].icon.text);
		$('#engine4_name').val(options.searchEngines[3].name);
		$('#engine4_url').val(options.searchEngines[3].url);

		$('#engine5_icon').attr('class', options.searchEngines[4].icon.class);
		$('#engine5_icon').text(options.searchEngines[4].icon.text);
		$('#engine5_name').val(options.searchEngines[4].name);
		$('#engine5_url').val(options.searchEngines[4].url);

		$('#engine6_icon').attr('class', options.searchEngines[5].icon.class);
		$('#engine6_icon').text(options.searchEngines[5].icon.text);
		$('#engine6_name').val(options.searchEngines[5].name);
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
				icon.text('');
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
		oldIcon = e.target;
		if ($('#iconselection').hasClass('hidden')) {
			let x = $(e.target).offset().left;
			let y = $(e.target).offset().top;

			$('#iconselection').offset({ top: y + 35, left: x });

			$('#iconselection').removeClass('hidden');
		} else {
			$('#iconselection').offset({ top: 0, left: 0 });

			$('#iconselection').addClass('hidden');
		}
	});

	$('#iconselection i').click((e) => {
		const newIcon = e.target;
		$(oldIcon).removeClass();
		$(oldIcon).addClass($(newIcon).attr('class'));
		$(oldIcon).text($(newIcon).text());
		$(oldIcon).trigger('click');
	});

	$('#save').click((e) => {
		options = {
			restoreEnabled: $('#restore').prop('checked'),
			duration: $('#duration').val(),
			balloonMenuEnabled: $('#balloon').prop('checked'),
			contextMenuEnabled: $('#context').prop('checked'),
			searchEngines: [
				{
					id: 'search1',
					icon: {
						class: $('#engine1_icon').attr('class'),
						text: $('#engine1_icon').text()
					},
					name: $('#engine1_name').val(),
					url: $('#engine1_url').val()
				},
				{
					id: 'search2',

					icon: {
						class: $('#engine2_icon').attr('class'),
						text: $('#engine2_icon').text()
					},

					name: $('#engine2_name').val(),
					url: $('#engine2_url').val()
				},
				{
					id: 'search3',

					icon: {
						class: $('#engine3_icon').attr('class'),
						text: $('#engine3_icon').text()
					},

					name: $('#engine3_name').val(),
					url: $('#engine3_url').val()
				},
				{
					id: 'search4',

					icon: {
						class: $('#engine4_icon').attr('class'),
						text: $('#engine4_icon').text()
					},

					name: $('#engine4_name').val(),
					url: $('#engine4_url').val()
				},
				{
					id: 'search5',

					icon: {
						class: $('#engine5_icon').attr('class'),
						text: $('#engine5_icon').text()
					},

					name: $('#engine5_name').val(),
					url: $('#engine5_url').val()
				},
				{
					id: 'search6',

					icon: {
						class: $('#engine6_icon').attr('class'),
						text: $('#engine6_icon').text()
					},

					name: $('#engine6_name').val(),
					url: $('#engine6_url').val()
				}
			]
		};

		// save options
		chrome.storage.sync.set({ options: options });

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

	// reset to default
	$('#reset').click((e) => {
		chrome.storage.sync.set({ options: preset });
	});
};

// initialization
localizeHtmlPage();
initializeElements();
initializeEvents();
