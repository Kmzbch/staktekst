'use strict';

import * as bubble_lib from './bubble_lib.js';

// attach overlay to the current page
let overlay = document.createElement('div');
overlay.id = 'staktekst_overlay';
overlay.className = 'hidden';
document.body.appendChild(overlay);

// turn the overlay off when clicked
overlay.addEventListener('click', (e) => {
    if (!overlay.classList.contains('hidden')) {
        overlay.classList.add('hidden');
    }
})

// attach event to onMessage
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.command === 'OVERLAY_ON') {
        overlay.classList.remove('hidden');
    } else if (request.command === 'OVERLAY_OFF') {
        overlay.classList.add('hidden');
    }
    sendResponse({});

    return true;
});