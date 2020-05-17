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

localizeHtmlPage();

const preset = {
	restoreEnabled: true,
	duration: 30,
	balloonMenuEnabled: true,
	contextMenuEnabled: false,
	searchEngines: [
		{
			id: 'search1',
			name: 'Google検索',
			url: 'https://encrypted.google.com/search?hl=en&gl=en&q=%s',
			icon: {
				class: 'material-icons iconButton',
				text: 'search'
			}
		},
		{
			id: 'search2',
			name: 'Vocabulary.comで単語を検索',
			url: 'https://www.vocabulary.com/dictionary/%s',
			icon: {
				class: 'material-icons iconButton',
				text: 'check'
			}
		},
		{
			id: 'search3',

			name: 'Do People Say Itで例文を検索',
			url: 'https://dopeoplesay.com/q/%s',
			icon: {
				class: 'material-icons iconButton',
				text: 'people'
			}
		},
		{
			id: 'search4',
			name: 'SKELLで例文を検索',
			url: 'https://skell.sketchengine.co.uk/run.cgi/concordance?lpos=&query=%s',
			icon: {
				class: 'mdi mdi-alpha-s-box iconButton iconButton',
				text: ''
			}
		},
		{
			id: 'search5',

			name: 'Netspeakで例文を検索',
			url: 'https://netspeak.org/#q=%s&corpus=web-en',
			icon: {
				class: 'mdi mdi-alpha-n-box iconButton iconButton',
				text: ''
			}
		},

		{
			id: 'search6',
			name: 'Youglishで発音を検索',
			url: 'https://youglish.com/search/%s',
			icon: {
				class: 'mdi mdi-youtube iconButton iconButton',
				text: ''
			}
		}
	]
};
let options = {};

chrome.storage.sync.get([ 'options' ], (res) => {
	if (typeof res.options === 'undefined') {
		options = preset;
	} else {
		options = res.options;
	}

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

$('#engine1_name, #engine2_name, #engine3_name, #engine4_name, #engine5_name, #engine6_name').on({
	change: (e) => {
		let name = e.target.value;
		if (name.match(/^[a-zA-Z]/)) {
			let iconButton = $(e.target).parent().find('.iconButton');
			iconButton.removeClass();
			iconButton.addClass(`mdi mdi-alpha-${name[0].toLowerCase()}-box iconButton`);
			iconButton.text('');
		} else {
			let iconButton = $(e.target).parent().find('.iconButton');
			iconButton.removeClass();
			iconButton.addClass(`material-icons iconButton`);
			iconButton.text('search');
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

let oldIcon;

// toggle icon Selection window
$('.form-group .iconButton').click((e) => {
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

$('#iconselection .iconButton').click((e) => {
	let newIcon = e.target;
	console.log(newIcon);
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

	chrome.storage.sync.set({ options: options });

	chrome.runtime.sendMessage(
		{
			command: 'OPTIONS'
		},
		(response) => {
			console.log('changed!');
		}
	);

	// return false;
});

$('#reset').click((e) => {
	chrome.storage.sync.set({ options: preset });
});
