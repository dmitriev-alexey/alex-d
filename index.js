'use strict';

var express = require('express');
var robots = require('express-robots-txt');
var path = require('path');
var serveStatic = require('serve-static');

var compression = require('compression');
var minify = require('express-minify');

var app = express();

var fs = require('fs');

var authorFile = fs.readFileSync("public/json/author.json.file");
var authorJson = JSON.parse(authorFile);

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