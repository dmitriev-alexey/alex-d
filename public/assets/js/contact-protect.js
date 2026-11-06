/*
 * Anti-scraping reveal for phone/email links (see index.js for the
 * server-side masking/encoding). The real value never appears in the
 * page's HTML - it's decoded here, client-side, only on click.
 */
(function () {
    'use strict';

    function decode(value) {
        return atob(value).split('').reverse().join('');
    }

    function onReveal(event) {
        var el = event.currentTarget;

        if (el.getAttribute('data-revealed')) {
            return; // already revealed - let the tel:/mailto: link work normally
        }

        event.preventDefault();

        var isPhone = el.getAttribute('data-contact') === 'phone';
        var real = decode(el.getAttribute('data-value'));
        var scheme = isPhone ? 'tel:' : 'mailto:';

        el.textContent = real;
        el.setAttribute('href', scheme + real);
        el.setAttribute('data-revealed', '1');

        // It's now a real tel:/mailto: link, not a reveal button - keep the
        // accessibility tree honest for screen readers and agents.
        el.removeAttribute('role');
        el.setAttribute('aria-label', (isPhone ? 'Call ' : 'Email ') + real);
    }

    var triggers = document.querySelectorAll('.contact-protect');
    for (var i = 0; i < triggers.length; i++) {
        triggers[i].addEventListener('click', onReveal);
    }
})();
