const runFirstTime = async () => {
	const manuals = {
		ja: [
			{
				id: 'e74ad1bb-ead3-4213-9a3e-dd7de7b096ab',
				type: 'bookmark',
				content:
					'Best Text-to-Speech Demo: Create Talking Avatars and Online Characters | Oddcast TTS Demo\nhttps://ttsdemo.com/',
				footnote: { tags: [], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:00.000Z'
			},
			{
				id: 'c9c5b066-702b-4a02-98b6-795abfd34276',
				type: 'bookmark',
				date: '2020-05-22T00:03:10.151Z',
				content: 'DeepL翻訳\nhttps://www.deepl.com/translator',
				footnote: { tags: [], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:01.000Z'
			},
			{
				id: 'aee3def5-9e4f-4791-9d8c-794c8c19e942',
				type: 'bookmark',
				content: 'Improve your English pronunciation using YouTube\nhttps://youglish.com/',
				footnote: { tags: [], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:02.000Z'
			},
			{
				id: '6511ea10-db73-4ac0-8204-f8f6bef35486',
				type: 'bookmark',
				content: 'Netspeak – Search for Words\nhttps://netspeak.org/',
				footnote: { tags: [], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:03.000Z'
			},
			{
				id: 'c807dc8a-b34a-47f2-b174-5610cdfedd77',
				type: 'bookmark',
				content: 'SkELL: corpus examples for learning English\nhttps://skell.sketchengine.co.uk/run.cgi/skell',
				footnote: { tags: [], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:04.000Z'
			},
			{
				id: '53fd2c61-b3ab-419b-84ef-ca33bf3a738c',
				type: 'bookmark',
				content:
					'Do people say it - find out if English native speakers actually say it\nhttps://dopeoplesay.com/',
				footnote: { tags: [], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:05.000Z'
			},
			{
				id: 'f6e33d6b-2320-4ac6-a566-ba0a45b00c78',
				type: 'bookmark',
				content: 'Vocabulary.com - Learn Words - English Dictionary\nhttps://www.vocabulary.com/',
				footnote: { tags: [], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:06.000Z'
			},
			{
				id: 'e7926210-0e0b-455e-90bb-ab795594e0f1',
				type: 'bookmark',
				content: 'Google\nhttps://www.google.co.jp/',
				footnote: { tags: [], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:07.000Z'
			},
			{
				id: '64c705ba-5e2a-4e08-987a-34bc8d674c94',
				type: 'note',
				content: '説明は以上です。＃WELCOME!ノートで操作を確認した後、ノートを空にして使用を開始してください。',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:08.000Z'
			},
			{
				id: '1cce6913-17bf-49b2-81ff-9982178be4b3',
				type: 'separator',
				content: '５．おわりに',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:09.000Z'
			},
			{
				id: '2b88cd0e-2153-4e03-8c01-5556688477f0',
				type: 'note',
				content: 'デフォルト検索エンジンの詳細は#bookmarkからご確認ください。\n\n※検索エンジンや各種設定はオプションから変更可能です。',
				footnote: { tags: [ 'WELCOME!', 'bookmark' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:10.000Z'
			},
			{
				id: '8113faf7-aaa5-4fe7-b4a4-f310d53e4caf',
				type: 'note',
				content:
					'・オプションの設定→Chrome拡張アイコンを右クリック\n・ノート中のリンクをバックグラウンドタブで開く→Ctrl＋リンクをクリック\n・重要なノートの閲覧→「重要なノート」をクリック\n※#pinnedタグ付きノートと日付・数字タグ付きのノートが表示されます。\n#pinnedタグはタグ追加時に📌に変換、日付・数字タグは青字で強調表示されます。\n・ノートのエクスポート→「ノートのエクスポート」をクリック',
				footnote: { tags: [ 'WELCOME!', 'pinned', '2020-05-21' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:11.000Z'
			},
			{
				id: '7d8dfe1e-0a64-4683-9812-7559db0b9fc0',
				type: 'separator',
				content: '4. その他の機能',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:12.000Z'
			},
			{
				id: '112a9c12-133b-4843-a6a8-fe300c98e73a',
				type: 'note',
				content:
					'３．３．ノートの整理\nノートは新しい順に日付区切り表示されますが、タグごとに以下を設定可能です。\n・ノート間をクリック→セパレータを挿入\n・ノートの並び替え→ノートをドラッグ\n\nセパレータと並び順はタグ検索時のみ表示・適用されます。&nbsp;また「ノートを空にする」から全ノートを削除可能です。\n\n※一度削除されたノートは元に戻せません。',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:13.000Z'
			},
			{
				id: '77dd07a8-35bf-4042-8a3e-73ab28d3139d',
				type: 'note',
				content:
					'３．２．検索ボックスからノートを検索\n・キーワード検索（例："買い物", "映画"）\n・タグ検索（例："#work", "💻プロジェクト"）\n・ショートカット検索\n:n #noteタグを検索\n:c #clipタグを検索\n:b #bookmarkタグを検索\n:d 日付・数字のタグを検索\n・表示中のタグを切替→ボックス入力時にCtrl+→またはCtrl+←\n\nまた検索ボックスをダブルクリックすると、ドロップダウンリストでタグを表示します。リストからはタグ検索の他、タグの編集・並び替え・削除が可能です。\n\n※変更は全ノートに反映されます',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:14.000Z'
			},
			{
				id: 'e7a8926d-8da2-4419-b979-8cd04ec45f4b',
				type: 'note',
				content:
					'３．１．ノートの作成・編集・削除\n・新規ノート作成→「新規ノート作成」アイコンをクリック（Ctrl+EnterまたはCtrl+Nでも可）\n・ノートを編集→「ノートを編集」アイコンをクリック（ノートをダブルクリックでも可）\n・編集を終了→編集中にCtrl+Enter\n・タグを追加→「タグを追加」フォームから入力（ダブルクリックでタグ候補を表示）\n・タグを削除→Ctrl+タグをクリック\n・ノートを削除→右上のチェックボックスをクリック\n・タグでノートを検索→タグをクリック',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:15.000Z'
			},
			{
				id: '17d46777-2655-4d74-9f74-a197b8d46dda',
				type: 'separator',
				content: '３．基本操作',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:16.000Z'
			},
			{
				id: 'b613f15f-5cd2-4ea9-b45a-538e6bc13570',
				type: 'note',
				content:
					'２．２．ノート管理ポップアップウィンドウ\nノートの作成と編集、フキダシランチャーから追加されたクリップやブックマークの閲覧をここから行えます。ノートは「#note」「#clip」「#bookmark」いずれかのタグに分類されます。\n\nまたこれら基本タグとは別に、複数のタグを追加可能です（個数上限あり）',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:17.000Z'
			},
			{
				id: '40fb5d34-76ac-4087-bd22-a96ea2666f4d',
				type: 'note',
				content: '２．１．フキダシランチャー\nWebページ中のテキストを選択時にフキダシ型のランチャーを表示します。ランチャーに登録された検索エンジンから選択テキストをウェブ検索できます。',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:18.000Z'
			},
			{
				id: '827724e1-e6e1-4505-84ce-179c0705e3f8',
				type: 'separator',
				content: '２．機能説明',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:19.000Z'
			},
			{
				id: 'de3a29b9-0054-4ead-96eb-5de134d8e3ef',
				type: 'note',
				content:
					'ようこそ！\n積んテク／StaktekstはWebテキストのかんたん検索・保存・閲覧ツールです。 はじめての方は以下の#WELCOME!タグをクリックしてマニュアルをご一読ください。\n\n説明が不要な方は「ノートを空にする」からWELCOME!ノートを削除し、そのまま使用を開始してください。',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:20.000Z'
			},
			{
				id: 'd8d05cdd-ed2e-4365-ad78-89762fc6e876',
				type: 'separator',
				content: '１．はじめに',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:21.000Z'
			}
		],
		en: [
			{
				id: 'e74ad1bb-ead3-4213-9a3e-dd7de7b096ab',
				type: 'bookmark',
				content:
					'Best Text-to-Speech Demo: Create Talking Avatars and Online Characters | Oddcast TTS Demo\nhttps://ttsdemo.com/',
				footnote: { tags: [], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:00.000Z'
			},
			{
				id: 'c9c5b066-702b-4a02-98b6-795abfd34276',
				type: 'bookmark',
				date: '2020-05-22T00:03:10.151Z',
				content: 'DeepL Translator\nhttps://www.deepl.com/translator',
				footnote: { tags: [], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:01.000Z'
			},
			{
				id: 'aee3def5-9e4f-4791-9d8c-794c8c19e942',
				type: 'bookmark',
				content: 'Improve your English pronunciation using YouTube\nhttps://youglish.com/',
				footnote: { tags: [], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:02.000Z'
			},
			{
				id: '6511ea10-db73-4ac0-8204-f8f6bef35486',
				type: 'bookmark',
				content: 'Netspeak – Search for Words\nhttps://netspeak.org/',
				footnote: { tags: [], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:03.000Z'
			},
			{
				id: 'c807dc8a-b34a-47f2-b174-5610cdfedd77',
				type: 'bookmark',
				content: 'SkELL: corpus examples for learning English\nhttps://skell.sketchengine.co.uk/run.cgi/skell',
				footnote: { tags: [], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:04.000Z'
			},
			{
				id: '53fd2c61-b3ab-419b-84ef-ca33bf3a738c',
				type: 'bookmark',
				content:
					'Do people say it - find out if English native speakers actually say it\nhttps://dopeoplesay.com/',
				footnote: { tags: [], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:05.000Z'
			},
			{
				id: 'f6e33d6b-2320-4ac6-a566-ba0a45b00c78',
				type: 'bookmark',
				content: 'Vocabulary.com - Learn Words - English Dictionary\nhttps://www.vocabulary.com/',
				footnote: { tags: [], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:06.000Z'
			},
			{
				id: 'e7926210-0e0b-455e-90bb-ab795594e0f1',
				type: 'bookmark',
				content: 'Google\nhttps://www.google.com/',
				footnote: { tags: [], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:07.000Z'
			},
			{
				id: '64c705ba-5e2a-4e08-987a-34bc8d674c94',
				type: 'note',
				content:
					"That's all for now. After playing around with the #WELCOME! notes, please empty them and start using it.",
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:08.000Z'
			},
			{
				id: '1cce6913-17bf-49b2-81ff-9982178be4b3',
				type: 'separator',
				content: '5. Closing',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:09.000Z'
			},
			{
				id: '2b88cd0e-2153-4e03-8c01-5556688477f0',
				type: 'note',
				content:
					'Search by #bookmark for the default search engines of Balloon Launcher\n\nYou can change search engines and settings from the options page. ',
				footnote: { tags: [ 'WELCOME!', 'bookmark' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:10.000Z'
			},
			{
				id: '8113faf7-aaa5-4fe7-b4a4-f310d53e4caf',
				type: 'note',
				content:
					'- Options -- Right-click on the extension icon\n- Open link in a note in new background tab -- Ctrl+click on the link&nbsp;\n- View important notes -- from "Important Notes" Icon\n* Search for #pinned notes and date tag notes. #pinned tag is converted into the emoji 📌\nDate tags are colored in blue.\n- Export notes as a file(txt/json)',
				footnote: { tags: [ 'WELCOME!', 'pinned', '2020-05-21' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:11.000Z'
			},
			{
				id: '7d8dfe1e-0a64-4683-9812-7559db0b9fc0',
				type: 'separator',
				content: '4. Other Features',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:12.000Z'
			},

			{
				id: '112a9c12-133b-4843-a6a8-fe300c98e73a',
				type: 'note',
				content:
					'3.3. Sort your notes\nNotes are grouped by date in new order, but you can set separators and note order for each tag by the following:\n\n- Click between notes to insert a separator.\n- Drag a note to reorder notes by drag.\n\nSeparators and note order are enabled only when notes are filtered by the associated tag.\n\nFor note delition, you can delete all the note in the "Empty Notes". Once deleted, the notes cannot be undone.',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:13.000Z'
			},
			{
				id: '77dd07a8-35bf-4042-8a3e-73ab28d3139d',
				type: 'note',
				content:
					'3.2. Search notes from the searchbox\n- Search by keywords (e.g., "shopping", "movie")\n- Search by a tag (e.g., "#work", "💻 project")\n- Search by shortcut commands:\n":n" #note tag.\n":c" #clip tag.\n":b" #bookmark tag.\n":d" date or number tags\nSwitch tags -- Ctrl+Left/Ctrl+Right in the searchbox\n\nYou can also open a dropdown tag list by double-click. The tags in the list can be edited,&nbsp;reordered, and deleteted. The changes made will be reflected in all notes.&nbsp;',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:14.000Z'
			},
			{
				id: 'e7a8926d-8da2-4419-b979-8cd04ec45f4b',
				type: 'note',
				content:
					'3.1. Create, Edit and Delete Notes\n- Create a new note -- click on the "New Note" icon (Alternatively, Ctrl+Enter or Ctrl+N)\n- Edit a note -- click on the "Edit" icon (Alternatively, double-click the note)\n- End editing -- Ctrl+Enter while editing\n- Add a tag -- type in the "Add tag" form (Double-click to display the tag list)\n- Delete a tag -- Ctrl+click on the tag\n- Delete a note -- check off the box at the top right\n- Search notes with tags -- click the tags',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:15.000Z'
			},
			{
				id: '17d46777-2655-4d74-9f74-a197b8d46dda',
				type: 'separator',
				content: '3. How to Use',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:16.000Z'
			},
			{
				id: 'b613f15f-5cd2-4ea9-b45a-538e6bc13570',
				type: 'note',
				content:
					'2.2. Note Management Pop-up Window\nIn this popup window, you can create and edit notes, and view clips and bookmarks&nbsp;added from the balloon launcher. Notes are categorized under the tag "#note", "#clip" or "#bookmark".\n\nIn addition to these default tags, you can add multiple tags to notes (the number of tags is limited).\n',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:17.000Z'
			},
			{
				id: '40fb5d34-76ac-4087-bd22-a96ea2666f4d',
				type: 'note',
				content:
					'2.1. Ballon Launcher\nThe ballon launcher shows up when you select text in a web page. You can search for selected text from the search engines registered in the launcher.',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:18.000Z'
			},
			{
				id: '827724e1-e6e1-4505-84ce-179c0705e3f8',
				type: 'separator',
				content: '2. Features',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:19.000Z'
			},
			{
				id: 'bee8e190-55a4-40e0-9df0-fae6eb44e0f6',
				type: 'note',
				content:
					'Welcome!\nStaktekst is a simple note-taking tool with search engines and text-clipping features. If you are new, please click on the #WELCOME! tag below to read the manual.\n\nYou can just&nbsp;delete those #WELCOME! notes by clicking "Empty Notes" if you want to skip this manual.',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:20.000Z'
			},
			{
				id: 'd8d05cdd-ed2e-4365-ad78-89762fc6e876',
				type: 'separator',
				content: '1. Introduction',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:21.000Z'
			}
		]
	};

	chrome.storage.local.get([ 'runFirstTime' ], (res) => {
		if (typeof res.runFirstTime === 'undefined') {
			stackStorage.get((raw) => {
				if (typeof raw === 'undefined') {
					stackStorage.set(JSON.stringify(manuals[chrome.i18n.getMessage('html_lang')]));
					chrome.storage.local.set({ runFirstTime: false });
					return true;
				}
			});
		} else {
			if (res.runFirstTime) {
				stackStorage.set(JSON.stringify(manuals[chrome.i18n.getMessage('html_lang')]));
				chrome.storage.local.set({ runFirstTime: false });
				return true;
			}
		}
	});
};

runFirstTime();
