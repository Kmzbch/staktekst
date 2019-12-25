'use strict';

import './currentTab.css';
import IconPreset from './IconPreset.js';

/* DOM creation and manipulation */
const createIconDOM = ({
    className,
    title,
    innerText = "",
    command: commandId
}) => {
    let iconDOM = document.createElement('i');

    iconDOM.setAttribute('class', className);
    iconDOM.setAttribute('title', title);
    iconDOM.innerText = innerText;

    iconDOM.addEventListener('mousedown', () => {
        chrome.runtime.sendMessage({
            command: commandId,
            selection: document.getSelection().toString()
        });
    });

    return iconDOM;
}

const createBubbleDOM = () => {

    let bubbleDOM = document.createElement('div');
    let leftContainer = document.createElement('div');
    let rightContainer = document.createElement('div');

    bubbleDOM.setAttribute('id', 'bubble');
    leftContainer.setAttribute('id', 'leftContainer');
    rightContainer.setAttribute('id', 'rightContainer');

    IconPreset.SEARCH_ENGINE_ICONS.forEach(icon => {
        leftContainer.appendChild(createIconDOM(icon));
    });
    IconPreset.SYSTEM_COMMAND_ICONS.forEach(icon => {
        rightContainer.appendChild(createIconDOM(icon));
    });

    bubbleDOM.appendChild(leftContainer);
    bubbleDOM.appendChild(rightContainer);

    return bubbleDOM;
}

const renderBubble = () => {
    setTimeout(() => {
        let selection = document.getSelection();

        if (selection.toString() === '') {
            bubble.style.display = 'none';
        } else {
            bubble.style.display = 'flex';

            let boundingCR = selection.getRangeAt(0).getBoundingClientRect();
            bubble.style.top = (boundingCR.top - 80) + window.scrollY + 'px';
            bubble.style.left = Math.floor((boundingCR.left + boundingCR.right) / 2) - 50 + window.scrollX + 'px';
        }
    }, 30)
}

const bubble = (() => {
    let elem = document.querySelector('#bubble');
    if (elem == null) {
        elem = createBubbleDOM();
        document.body.appendChild(elem);
    }
    return elem;
})();

document.addEventListener('mouseup', renderBubble);