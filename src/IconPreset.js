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

class IconPreset {
    static get SEARCH_ENGINE_ICONS() {
        return searchEngineIcons;
    }
    static get SYSTEM_COMMAND_ICONS() {
        return systemCommandIcons;
    }
}

export default IconPreset;