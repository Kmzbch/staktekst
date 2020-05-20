const runFirstTime = () => {
	const manuals = {
		ja: [
			{
				id: '64c705ba-5e2a-4e08-987a-34bc8d674c94',
				type: 'note',
				content: '説明は以上です。ノートを空にして、開始してください。​',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:00.000Z'
			},
			{
				id: '1cce6913-17bf-49b2-81ff-9982178be4b3',
				type: 'separator',
				content: '４．おわりに',
				footnote: { tags: [ '#WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:01.000Z'
			},

			{
				id: '8113faf7-aaa5-4fe7-b4a4-f310d53e4caf',
				type: 'note',
				content: '・オプションの設定→Chrome拡張アイコンを右クリック\n・ノート中のリンクをバックグラウンドタブで開く→Ctrl＋リンクをクリック',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:02.000Z'
			},
			{
				id: 'b713bae9-e57b-4608-ac12-3d65a78df1bb',
				type: 'separator',
				content: '３．その他',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:03.000Z'
			},
			{
				id: '112a9c12-133b-4843-a6a8-fe300c98e73a',
				type: 'note',
				content:
					'２．３．ノートの整理\n通常、ノートは新しい順に日付区切りで表示されますが、タグごとに以下を設定可能です。\n\n・ノートの並び替え→ノートをドラッグ\n・ノート間をクリック→セパレータを挿入\n\nノートの並び順やセパレータはタグ検索時のみ表示・反映されます。\n\n同様にドロップダウンリスト中のタグもドラッグで並び替え可能です。\n\n全ノートの削除\n・「ノートを空にする」からノート削除。一度削除されたノートは元に戻せません。',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:04.000Z'
			},
			{
				id: '77dd07a8-35bf-4042-8a3e-73ab28d3139d',
				type: 'note',
				content:
					'２．２ ノートの検索\n検索ボックスから以下の方法でノートを検索可能です。\n・キーワード検索（例："買い物", "映画"）\n・タグ検索（例："#work", "💻プロジェクト"）\n・タグ検索ショートカット\n:n #noteタグを検索\n:c #clipタグを検索\n:b #bookmarkタグを検索\n:d 日付・数字のタグを検索\n\nまた検索ボックスをダブルクリックすると、ドロップダウンリストでタグを表示します。タグ検索の他、編集・並び替え・削除も可能です。',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:05.000Z'
			},
			{
				id: 'e7a8926d-8da2-4419-b979-8cd04ec45f4b',
				type: 'note',
				content:
					'２．２ ノートの作成・編集・削除\n各ノートに対して以下のアクションを行います。\n\n・新規ノート作成→Ctrl+EnterまたはCtrl+N\n・ノートを編集→ノートをダブルクリックまたはペンアイコンをクリック\n・編集を終了→編集中にCtrl+Enter\n・タグを追加→タグ空欄から入力\n・既存タグからタグを選択→タグ入力欄をダブルクリック\n・タグを削除→Ctrl+タグをクリック\n・ノートを削除→ノート右上のチェックボックスをクリック\n・ノートのタグ検索→タグをクリック',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:06.000Z'
			},
			{
				id: 'b613f15f-5cd2-4ea9-b45a-538e6bc13570',
				type: 'note',
				content:
					'２．１ ノートの種類\n本ポップアップウィンドウからは、ノートの作成と編集、フキダシランチャーから追加されたクリップやブックマークの閲覧等を行います。表示アイテムは以下の三種類です。\n\n・ノート(#note) 本ウィンドウから作成。\n・クリップ(#clip) フキダシランチャーから追加されたテキストとWebページ。編集不可。\n・ブックマーク(#bookmark) フキダシランチャーから追加されたWebページのタイトルとリンク。編集不可。\n\nこれらの基本タグとは別に、複数のタグを追加可能です（個数上限あり）。',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:07.000Z'
			},
			{
				id: '40fb5d34-76ac-4087-bd22-a96ea2666f4d',
				type: 'note',
				content:
					'１．フキダシランチャー\nWebページ中のテキストを選択時にフキダシ型ランチャーを表示します。ランチャーからは登録された検索エンジンで単語や文、パラグラフを検索できます。\n※オプションから機能のオン／オフ切替や検索エンジンの変更可能です。',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:08.000Z'
			},
			{
				id: '827724e1-e6e1-4505-84ce-179c0705e3f8',
				type: 'separator',
				content: '２．基本操作',
				footnote: { tags: [ '#WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:09.000Z'
			},
			{
				id: 'de3a29b9-0054-4ead-96eb-5de134d8e3ef',
				type: 'note',
				content:
					'ようこそ！\n積んテク／Staktekstは英語学習者を支援するWebテキストかんたん検索・保存・閲覧ツールです。 はじめての方は#WELCOME!タグをクリックして使用方法をご確認ください。\n\n説明が不要な方は「ノートを空にする」からWELCOME!ノートを削除し、そのまま使用を開始してください。\n\n積んテク／Staktekst\nhttp://www.google.co.jp',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:10.000Z'
			},
			{
				id: 'd8d05cdd-ed2e-4365-ad78-89762fc6e876',
				type: 'separator',
				content: '１．はじめに',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:11.000Z'
			}
		],
		en: [
			{
				id: '64c705ba-5e2a-4e08-987a-34bc8d674c94',
				type: 'note',
				content: '説明は以上です。ノートを空にして、開始してください。​',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:00.000Z'
			},
			{
				id: '1cce6913-17bf-49b2-81ff-9982178be4b3',
				type: 'separator',
				content: '４．おわりに',
				footnote: { tags: [ '#WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:01.000Z'
			},

			{
				id: '8113faf7-aaa5-4fe7-b4a4-f310d53e4caf',
				type: 'note',
				content: '・オプションの設定→Chrome拡張アイコンを右クリック\n・ノート中のリンクをバックグラウンドタブで開く→Ctrl＋リンクをクリック',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:02.000Z'
			},
			{
				id: 'b713bae9-e57b-4608-ac12-3d65a78df1bb',
				type: 'separator',
				content: '３．その他',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:03.000Z'
			},

			{
				id: '112a9c12-133b-4843-a6a8-fe300c98e73a',
				type: 'note',
				content:
					'２．３．ノートの整理\n通常、ノートは新しい順に日付区切りで表示されますが、タグごとに以下を設定可能です。\n\n・ノートの並び替え→ノートをドラッグ\n・ノート間をクリック→セパレータを挿入\n\nノートの並び順やセパレータはタグ検索時のみ表示・反映されます。\n\n同様にドロップダウンリスト中のタグもドラッグで並び替え可能です。\n\n全ノートの削除\n・「ノートを空にする」からノート削除。一度削除されたノートは元に戻せません。',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:04.000Z'
			},
			{
				id: '77dd07a8-35bf-4042-8a3e-73ab28d3139d',
				type: 'note',
				content:
					'２．２ ノートの検索\n検索ボックスから以下の方法でノートを検索可能です。\n・キーワード検索（例："買い物", "映画"）\n・タグ検索（例："#work", "💻プロジェクト"）\n・タグ検索ショートカット\n:n #noteタグを検索\n:c #clipタグを検索\n:b #bookmarkタグを検索\n:d 日付・数字のタグを検索\n\nまた検索ボックスをダブルクリックすると、ドロップダウンリストでタグを表示します。タグ検索の他、編集・並び替え・削除も可能です。',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:05.000Z'
			},
			{
				id: 'e7a8926d-8da2-4419-b979-8cd04ec45f4b',
				type: 'note',
				content:
					'２．２ ノートの作成・編集・削除\n各ノートに対して以下のアクションを行います。\n\n・新規ノート作成→Ctrl+EnterまたはCtrl+N\n・ノートを編集→ノートをダブルクリックまたはペンアイコンをクリック\n・編集を終了→編集中にCtrl+Enter\n・タグを追加→タグ空欄から入力\n・既存タグからタグを選択→タグ入力欄をダブルクリック\n・タグを削除→Ctrl+タグをクリック\n・ノートを削除→ノート右上のチェックボックスをクリック\n・ノートのタグ検索→タグをクリック',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:06.000Z'
			},
			{
				id: 'b613f15f-5cd2-4ea9-b45a-538e6bc13570',
				type: 'note',
				content:
					'２．１ ノートの種類\n本ポップアップウィンドウからは、ノートの作成と編集、フキダシランチャーから追加されたクリップやブックマークの閲覧等を行います。表示アイテムは以下の三種類です。\n\n・ノート(#note) 本ウィンドウから作成。\n・クリップ(#clip) フキダシランチャーから追加されたテキストとWebページ。編集不可。\n・ブックマーク(#bookmark) フキダシランチャーから追加されたWebページのタイトルとリンク。編集不可。\n\nこれらの基本タグとは別に、複数のタグを追加可能です（個数上限あり）。',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:07.000Z'
			},
			{
				id: '40fb5d34-76ac-4087-bd22-a96ea2666f4d',
				type: 'note',
				content:
					'１．フキダシランチャー\nWebページ中のテキストを選択時にフキダシ型ランチャーを表示します。ランチャーからは登録された検索エンジンで単語や文、パラグラフを検索できます。\n※オプションから機能のオン／オフ切替や検索エンジンの変更可能です。',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:08.000Z'
			},
			{
				id: '827724e1-e6e1-4505-84ce-179c0705e3f8',
				type: 'separator',
				content: '２．基本操作',
				footnote: { tags: [ '#WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:09.000Z'
			},
			{
				id: 'de3a29b9-0054-4ead-96eb-5de134d8e3ef',
				type: 'note',
				content:
					'ようこそ！\n積んテク／Staktekstは英語学習者を支援するWebテキストかんたん検索・保存・閲覧ツールです。 はじめての方は#WELCOME!タグをクリックして使用方法をご確認ください。\n\n説明が不要な方は「ノートを空にする」からWELCOME!ノートを削除し、そのまま使用を開始してください。\n\n積んテク／Staktekst\nhttp://www.google.co.jp',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:10.000Z'
			},
			{
				id: 'd8d05cdd-ed2e-4365-ad78-89762fc6e876',
				type: 'separator',
				content: '１．はじめに',
				footnote: { tags: [ 'WELCOME!' ], pageTitle: '', pageURL: '' },
				date: '2020-05-20T00:00:11.000Z'
			}
		]
	};

	chrome.storage.local.get([ 'runFirstTime' ], (res) => {
		if (typeof res.runFirstTime === 'undefined') {
			stackStorage.get((raw) => {
				if (typeof raw === 'undefined') {
					stackStorage.set(JSON.stringify(manuals[chrome.i18n.getMessage('html_lang')]));
					chrome.storage.local.set({ runFirstTime: false });
				}
			});
		} else {
			if (res.runFirstTime) {
				chrome.storage.local.set({ runFirstTime: false });
			}
		}
	});
};
