'use strict';

import * as bubble_lib from './bubble_lib.js';

// overlay
let overlay = document.createElement('div');
overlay.id = 'overlay';
overlay.className = 'hidden';
document.body.appendChild(overlay);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('received!');
    if (request.command === 'OVERLAY_ON') {
        overlay.classList.remove('hidden');
    } else if (request.command === 'OVERLAY_OFF') {
        overlay.classList.add('hidden');
    }
    sendResponse({});
    return true;
});