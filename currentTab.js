'use strict';

// attach overlay to the current page
let overlay = $("<div></div>", {
    id: 'staktekst_overlay',
    addClass: 'hidden',
    on: {
        click: (e) => {
            if (!$('#staktekst_overlay').hasClass('hidden')) {
                $('#staktekst_overlay').addClass('hidden');
            }
        }
    }
})
$('body').append(overlay);

// attach event to onMessage
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.command === 'OVERLAY_ON') {
        $('#staktekst_overlay').removeClass('hidden');
    } else if (request.command === 'OVERLAY_OFF') {
        $('#staktekst_overlay').addClass('hidden');
    }
    sendResponse({});

    return true;
});