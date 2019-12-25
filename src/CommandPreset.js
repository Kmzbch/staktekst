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
        id: "google",
        title: "Google画像検索",
        contexts: ["selection"],
        url: "https://encrypted.google.com/search?hl=en&gl=en&tbm=isch&q=%s",
    },


];
const searchEngineIcons = [{
        className: "material-icons stackButton",
        title: "Google画像検索",
        innerText: "search",
        command: "google",
    }, {
        className: "material-icons stackButton",
        title: "Vocabulary.com単語検索",
        innerText: "check",
        command: "vocabulary",
    }, {
        className: "fas fa-user-friends stackButton",
        title: "Do People Say It",
        command: "dopeoplesayit",
    },
    {
        className: "fas fa-book fa-lg stackButton",
        title: "SKELL",
        command: "wordsketch",
    }, {
        className: "fab fa-twitter fa-lg stackButton",
        title: "Twitter検索",
        command: "twitter",
    },
    {
        className: "fab fa-youtube fa-lg stackButton",
        title: "Youglish検索",
        command: "youglish",
    }, {
        className: "material-icons stackButton",
        title: "みらい翻訳で英→日翻訳",
        innerText: "translate",
        command: "mirai",
    }, {
        className: "material-icons stackButton",
        title: "テキストを読み上げ",
        innerText: "message",
        command: "odd",
    }
]

const systemCommandIcons = [{
    className: "material-icons stackButton",
    title: "URL付きコピー",
    innerText: "assignment",
    command: "extendedcopy",
}, {
    className: "material-icons stackButton",
    title: "テキストをプッシュ",
    innerText: "input",
    command: "pushtext",
}]


class CommandPreset {
    static get PRESET_CONTEXT_MENUS() {
        return commands;
    }
    static get SEARCH_ENGINE_ICONS() {
        return searchEngineIcons;
    }
    static get SYSTEM_COMMAND_ICONS() {
        return systemCommandIcons;
    }
}

export default CommandPreset;