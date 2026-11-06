'use strict';

// Contact anti-scraping helpers for the HTML page. See index.js / the
// #about + #contact sections of templates/index.ejs and the client-side
// decoder in public/assets/js/contact-protect.js. This isn't real
// security (the decode logic is public), but it keeps the plain phone/
// email out of the served markup so basic regex/HTML scrapers can't lift
// them, while a human just clicks to reveal.

// Reversed string, then base64 - mirrored by contact-protect.js on click.
function obfuscate(value) {
    return Buffer.from(String(value).split('').reverse().join('')).toString('base64');
}

// "+375 25 740 58 93" -> "+375 25 *** ** 93" (keep first two groups and
// the last one, star the middle groups).
function maskPhone(phone) {
    var groups = String(phone).split(' ');
    return groups.map(function (group, idx) {
        if (idx < 2 || idx === groups.length - 1) {
            return group;
        }
        return group.replace(/./g, '*');
    }).join(' ');
}

// "dmitriew.alexej@gmail.com" -> "d**************@gmail.com" (keep the
// first local char and the whole domain, star the rest of the local part).
function maskEmail(email) {
    var atIndex = String(email).indexOf('@');
    if (atIndex <= 1) {
        return email;
    }
    var local = email.slice(0, atIndex);
    var domain = email.slice(atIndex);
    return local.slice(0, 1) + local.slice(1).replace(/./g, '*') + domain;
}

module.exports = {
    obfuscate: obfuscate,
    maskPhone: maskPhone,
    maskEmail: maskEmail
};
