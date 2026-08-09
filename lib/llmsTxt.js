'use strict';

// Builds the /llms.txt content (see https://llmstxt.org) from the same
// data used everywhere else, so it never goes stale.
//
// NOTE: llms.txt is meant to be read by bots/LLMs, so we deliberately do
// NOT include the raw phone/email here - that would undo the contact
// anti-scraping done for the HTML page. The site + social links are the
// machine-facing contact points instead.

function topSkillNames(skills, limit) {
    return (skills || [])
        .slice()
        .sort(function (a, b) {
            return (parseInt(b.level, 10) || 0) - (parseInt(a.level, 10) || 0);
        })
        .slice(0, limit)
        .map(function (skill) {
            return skill.name;
        });
}

function build(data) {
    var author = data.author;
    var site = String(author.site).replace(/\/+$/, ''); // no trailing slash

    var lines = [];

    lines.push('# ' + author.name + ' — Mobile and Web Application Developer');
    lines.push('');
    lines.push('> Personal résumé and portfolio of ' + author.name + ', a mobile and ' +
        'web application developer (Android, iOS, JavaScript) based in ' +
        author.address + ', with ' + author.experienceYears + '+ years of experience.');
    lines.push('');

    lines.push('## Résumé & documents');
    lines.push('- [Portfolio & résumé site](' + site + '/): single-page résumé, skills, experience and portfolio.');
    lines.push('- [Résumé PDF (generated on the fly)](' + site + '/resume.pdf): always-current résumé built from live data.');
    lines.push('- [CV PDF](' + site + '/' + author.pdf_cv + ')');
    lines.push('- [About Projects PDF](' + site + '/' + author.pdf + ')');
    lines.push('');

    var skills = topSkillNames(data.skills, 10);
    if (skills.length) {
        lines.push('## Top skills');
        lines.push('- ' + skills.join(', '));
        lines.push('');
    }

    var social = author.social || {};
    var socialKeys = Object.keys(social);
    if (socialKeys.length) {
        lines.push('## Links');
        socialKeys.forEach(function (key) {
            var label = key.charAt(0).toUpperCase() + key.slice(1);
            lines.push('- [' + label + '](' + social[key] + ')');
        });
        lines.push('');
    }

    return lines.join('\n');
}

module.exports = {
    build: build
};
