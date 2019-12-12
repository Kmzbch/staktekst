const commands = [{
        id: "mirai",
        title: "みらい翻訳（英→日）",
        contexts: ["selection"],
        url: "https://miraitranslate.com/en/trial/",
    },
    {
        id: "odd",
        title: "A Jump to the Sky Turns to a Riderkick",
        contexts: ["selection"],
        url: "http://www.oddcast.com/ttsdemo/index.php",
    },
    {
        id: "extendedcopy",
        title: "URL付きでコピー",
        contexts: ["selection"],
    },
    {
        id: "pushtext",
        title: "テキストをプッシュ",
        contexts: ["page", "selection"],
    },
    {
        id: "sep1",
        type: 'separator',
        contexts: ["selection"],
    },
    {
        id: "youglish",
        title: "Youglish",
        contexts: ["selection"],
        url: "https://youglish.com/search/%s",
        option: ({
            url
        }) => {
            chrome.windows.create({
                url: url,
                type: "popup",
                width: 480,
                height: 700,
                focused: true,
            });
        }
    },
    {
        id: "smmry",
        title: "記事を要約(Smmry.com)",
        contexts: ["page"],
        url: "https://smmry.com/%u#&SM_LENGTH=10",
    },
    {
        id: "dopeoplesayit",
        title: "Do People Say It",
        contexts: ["selection"],
        url: "https://dopeoplesay.com/q/%s",
    },
    {
        id: "skell",
        title: "SKELL",
        contexts: ["selection"],
        url: "https://skell.sketchengine.co.uk/run.cgi/concordance?lpos=&query=%s",
    },
    {
        id: "twitter",
        title: "Twitter",
        contexts: ["selection"],
        url: "https://twitter.com/search?q=%s",
    },
    {
        id: "vocabulary",
        title: "Vocabulary.com",
        contexts: ["selection"],
        url: "https://www.vocabulary.com/dictionary/%s",
    },
    {
        id: "powert",
        title: "Powere Thesaurus",
        contexts: ["selection"],
        url: "https://www.powerthesaurus.org/%s/synonyms",
    },
    {
        id: "ud",
        title: "Urban Dictionary",
        url: "https://www.urbandictionary.com/define.php?term=%s",
        contexts: ["selection"],
    },
    {
        id: "sc",
        title: "Scrapbox",
        contexts: ["selection"],
        url: "https://scrapbox.io/english-idioms/search/page?q=%s",
    },
    {
        id: "keep",
        title: "Keep",
        contexts: ["selection"],
        url: "https://keep.google.com/#search/text%253D%s",
    },
    {
        id: "sep2",
        type: 'separator',
        contexts: ["selection"],
    },
    {
        id: "wordsketch",
        title: "Word Sketch",
        contexts: ["selection"],
        url: "https://skell.sketchengine.co.uk/run.cgi/wordsketch?lpos=&query=%s",
    },
    {
        id: "hc",
        title: "Hyper Collocation",
        contexts: ["selection"],
        url: "https://hypcol.marutank.net/ja/?d=f&q=%s",
    },
];

class CommandPreset {
    static get PRESET() {
        return commands;
    }
}

export default CommandPreset;