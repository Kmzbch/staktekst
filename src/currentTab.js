import './currentTab.css';
import CommandPreset from './CommandPreset.js';

const bubbleDOM = createBubbleDOM();

function getMessage(request, sender, sendResponse) {
    sendResponse({
        selection: document.getSelection().toString()
    });
}

function sendCommandMessage(command) {
    chrome.runtime.sendMessage({
        command: command,
        selection: document.getSelection().toString()
    });
}

function createIconDOM({
    className,
    title,
    innerText = "",
    command
}) {
    let iconDOM = document.createElement("i");
    iconDOM.setAttribute("class", className);
    iconDOM.setAttribute("title", title);
    iconDOM.innerText = innerText;
    iconDOM.addEventListener("mousedown", () => {
        sendCommandMessage(command)
    });
    return iconDOM;
}

function createBubbleDOM() {

    let bubbleDOM = document.createElement("div");
    bubbleDOM.setAttribute("id", "bubble");

    let searchEngineDIV = document.createElement("div");
    searchEngineDIV.setAttribute("id", "searchEngineDiv");
    CommandPreset.SEARCH_ENGINE_ICONS.forEach(icon => {
        searchEngineDIV.appendChild(createIconDOM(icon));
    });

    let systemCommandDIV = document.createElement("div");
    systemCommandDIV.setAttribute("id", "systemCommandDiv");
    CommandPreset.SYSTEM_COMMAND_ICONS.forEach(icon => {
        systemCommandDIV.appendChild(createIconDOM(icon));
    });

    bubbleDOM.appendChild(searchEngineDIV);
    bubbleDOM.appendChild(systemCommandDIV);

    return bubbleDOM;
}

function renderBubble() {
    setTimeout(() => {
        let selection = document.getSelection();

        if (selection.toString() === "") {
            bubbleDOM.style.display = "none";
        } else {
            let boundingCR = selection.getRangeAt(0).getBoundingClientRect();

            bubbleDOM.style.display = "flex";
            bubbleDOM.style.top = boundingCR.top - 75 + window.scrollY + 'px';
            bubbleDOM.style.left = Math.floor((boundingCR.left + boundingCR.right) / 2) - 50 + window.scrollX + 'px';
        }
    }, 30)
}

document.body.appendChild(bubbleDOM);

chrome.runtime.onMessage.addListener(getMessage);
document.addEventListener("mouseup", renderBubble);