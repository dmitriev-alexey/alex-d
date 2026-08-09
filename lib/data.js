'use strict';

// Loads the site content from the (non-public) data/ directory and enriches
// the author object with derived fields. Called once at startup by index.js;
// the returned objects are held in memory and reused for every request, so
// this does no per-request work.

var fs = require('fs');
var path = require('path');

var contacts = require('./contacts');

var DATA_DIR = path.join(__dirname, '..', 'data');

function readJson(filename) {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename)));
}

// Whole-year difference between two dates (used for age and years of
// experience). Mirrors the original helper: diff the epoch millis, read the
// result back as a date, and take its distance from 1970.
function yearsBetween(startDate, endDate) {
    var ms = endDate.getTime() - startDate.getTime();
    var date = new Date(ms);
    return Math.abs(date.getUTCFullYear() - 1970);
}

function enrichAuthor(author, now) {
    // author.age holds a birth date in the JSON; turn it into a number of years.
    author.age = yearsBetween(new Date(author.age), now);
    author.experienceYears = yearsBetween(new Date(author.experienceStartDate), now);

    // "My Story" paragraphs carry a {{years}} token - resolve it once so both
    // the EJS page and the PDF (lib/resumePdf.js) render the same final text.
    author.myStory = author.myStory.map(function (paragraph) {
        return paragraph.split('{{years}}').join(author.experienceYears);
    });

    // Masked + obfuscated contact values for the anti-scraping reveal-on-click
    // links; the raw phone/email are never handed to the template.
    author.phoneMasked = contacts.maskPhone(author.phone);
    author.emailMasked = contacts.maskEmail(author.email);
    author.phoneObfuscated = contacts.obfuscate(author.phone);
    author.emailObfuscated = contacts.obfuscate(author.email);

    return author;
}

function load() {
    var now = new Date();

    return {
        author: enrichAuthor(readJson('author.json.file'), now),
        skills: readJson('skills.json.file'),
        works: readJson('works.json.file'),
        educations: readJson('educations.json.file'),
        categories: readJson('projects_category.json.file'),
        manifest: readJson('manifest.json.file')
    };
}

module.exports = {
    load: load
};
