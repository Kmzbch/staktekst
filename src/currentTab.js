import './currentTab.css';
import CommandPreset from './CommandPreset.js';

/* communicate with background.js */
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

/* DOM creation and manipulation */
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

    let leftContainer = document.createElement("div");
    leftContainer.setAttribute("id", "leftContainer");

    let rightContainer = document.createElement("div");
    rightContainer.setAttribute("id", "rightContainer");

    CommandPreset.SEARCH_ENGINE_ICONS.forEach(icon => {
        leftContainer.appendChild(createIconDOM(icon));
    });
    CommandPreset.SYSTEM_COMMAND_ICONS.forEach(icon => {
        rightContainer.appendChild(createIconDOM(icon));
    });

    bubbleDOM.appendChild(leftContainer);
    bubbleDOM.appendChild(rightContainer);

    return bubbleDOM;
}

function renderBubble() {
    setTimeout(() => {
        let selection = document.getSelection();

        if (selection.toString() === "") {
            bubbleDOM.style.display = "none";
        } else {
            bubbleDOM.style.display = "flex";

            let boundingCR = selection.getRangeAt(0).getBoundingClientRect();
            bubbleDOM.style.top = (boundingCR.top - 80) + window.scrollY + 'px';
            bubbleDOM.style.left = Math.floor((boundingCR.left + boundingCR.right) / 2) - 50 + window.scrollX + 'px';
        }
    }, 30)
}

// bubble stay in the page
const bubbleDOM = createBubbleDOM();

document.body.appendChild(bubbleDOM);

chrome.runtime.onMessage.addListener(getMessage);
document.addEventListener("mouseup", renderBubble);