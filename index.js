'use strict';

var express = require('express');
var robots = require('express-robots-txt');
var path = require('path');
var serveStatic = require('serve-static');

var compression = require('compression');
var minify = require('express-minify');

var resumePdf = require('./lib/resumePdf');

var app = express();

var fs = require('fs');

var authorFile = fs.readFileSync("public/json/author.json.file");
var authorJson = JSON.parse(authorFile);
authorJson.age = getYearDiffWithMonth(new Date(authorJson.age), new Date())
authorJson.experienceYears = getYearDiffWithMonth(new Date(authorJson.experienceStartDate), new Date())

// "My Story" paragraphs come from author.json.file with a {{years}} token
// standing in for the experience figure - resolve it once here so both the
// EJS page and the PDF (lib/resumePdf.js) render the same final text.
authorJson.myStory = authorJson.myStory.map(function (paragraph) {
    return paragraph.split('{{years}}').join(authorJson.experienceYears);
});

// Anti-scraping for phone/email on the HTML page (the PDF keeps the plain
// values - see lib/resumePdf.js). The page never prints the real value in
// the markup: it shows a masked version and ships a reversed-base64 blob
// that assets/js/contact-protect.js decodes only once the visitor clicks.
// This isn't real security (anyone can read the decode logic), but it
// defeats the plain regex/HTML scrapers that make up most of the traffic
// trying to harvest contact details, without hiding anything from a human.
function obfuscateContactValue(value) {
    return Buffer.from(String(value).split('').reverse().join('')).toString('base64');
}

function maskPhone(phone) {
    var groups = String(phone).split(' ');
    return groups.map(function (group, idx) {
        if (idx < 2 || idx === groups.length - 1) {
            return group;
        }
        return group.replace(/./g, '*');
    }).join(' ');
}

function maskEmail(email) {
    var atIndex = String(email).indexOf('@');
    if (atIndex <= 1) {
        return email;
    }
    var local = email.slice(0, atIndex);
    var domain = email.slice(atIndex);
    return local.slice(0, 1) + local.slice(1).replace(/./g, '*') + domain;
}

authorJson.phoneMasked = maskPhone(authorJson.phone);
authorJson.emailMasked = maskEmail(authorJson.email);
authorJson.phoneObfuscated = obfuscateContactValue(authorJson.phone);
authorJson.emailObfuscated = obfuscateContactValue(authorJson.email);

var skillsFile = fs.readFileSync("public/json/skills.json.file");
var skillsJson = JSON.parse(skillsFile);

var workFile = fs.readFileSync("public/json/works.json.file");
var workJson = JSON.parse(workFile);

var educationsFile = fs.readFileSync("public/json/educations.json.file");
var educationsJson = JSON.parse(educationsFile);

var categoryFile = fs.readFileSync("public/json/projects_category.json.file");
var categoryJson = JSON.parse(categoryFile);

var manifestFile = fs.readFileSync("public/json/manifest.json.file");
var manifestJson = JSON.parse(manifestFile);

// workJson.forEach(function (item) {       https://tinypng.com/
//     console.log(item.projects.length);
// });

// process.env.NODE_ENV = 'dev';
process.env.NODE_ENV = 'production';

var ejs = require('ejs');

app.set('views', __dirname + '/templates');
app.set('view engine', 'ejs');

app.set('port', (process.env.PORT || 6000));


app.use(compression());     // gzip
app.use(minify());          // минимизация css и js
// app.use(compression({
//     // Сжимаем HTTP ответы, тело которых длиннее одного байта
//     threshold: 1,
//     // Сжимаем HTTP ответы независимо от их mime-типа
//     filter: function () {
//         return true;
//     }
// }));
// app.use(minify);        // минимизация css и js

app.use(serveStatic(path.join(__dirname, 'public'), {
    maxAge: '183d',                                 // кэшируем  ресурсы на пол года
    setHeaders: setCustomCacheControl               // свой кэш контрол
}));                                                // установка публичной директории с статическим контентом
app.use(robots(__dirname + '/robots.txt'));         // уснатовка через плагин файла  robots.txt


// /* Redirect http to https */
// app.use('*', ensureSecure);

app.get('/sitemap*/', function (req, res) {
    res.contentType("application/xml");
    res.sendFile(path.join(__dirname, "sitemap.xml"));
});

app.get('/manifest*/', function (req, res) {
    res.contentType("application/json");
    res.send(manifestJson);
});

app.get('/resume.pdf', function (request, response) {
    // Generated fresh on every request - no caching.
    resumePdf.generateResumePdfBuffer({
        author: authorJson,
        skills: skillsJson,
        works: workJson,
        educations: educationsJson
    }).then(function (buffer) {
        response.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'inline; filename="' + authorJson.name.replace(/\s+/g, '') + 'Resume.pdf"'
        });
        response.send(buffer);
    }).catch(function (err) {
        console.log("Failed to generate resume.pdf: " + err.message);
        response.status(500).send('Resume PDF is temporarily unavailable.');
    });
});

app.get('/', function (request, response) {
    response.render("index", {
        author: authorJson,
        skills: skillsJson,
        works: workJson,
        educations: educationsJson,
        categories: categoryJson
    });
});

app.use(function (request, response) {
    console.log("404 not found by originalUrl = " + request.originalUrl);
    response.status(404).render('error404');
});

app.listen(app.get('port'), function () {
    console.log("Node app is running at localhost:" + app.get('port'));
});

// Redirect all HTTP traffic to HTTPS
function ensureSecure(req, res, next){
    if(req.headers["x-forwarded-proto"] === "https"){
        // OK, continue
        return next();
    }
    res.redirect(302, 'https://'+ req.hostname + req.url);
}

function setCustomCacheControl (res, path) {
    if (serveStatic.mime.lookup(path) === 'text/html') {
        // Custom Cache-Control for HTML files
        res.setHeader('Cache-Control', 'public, max-age=3600'); // text/html кэшируем на один час
    }
}

function getYearDiffWithMonth(startDate, endDate) {
    const ms = endDate.getTime() - startDate.getTime();
  
    const date = new Date(ms);
  
    return Math.abs(date.getUTCFullYear() - 1970);
  }