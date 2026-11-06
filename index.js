'use strict';

var express = require('express');
var robots = require('express-robots-txt');
var path = require('path');
var serveStatic = require('serve-static');

var compression = require('compression');
var minify = require('express-minify');

var swaggerUi = require('swagger-ui-express');
var openapiSpec = require('./openapi');

var app = express();

var fs = require('fs');

var authorFile = fs.readFileSync("public/json/author.json.file");
var authorJson = JSON.parse(authorFile);
authorJson.age = getYearDiffWithMonth(new Date(authorJson.age), new Date())

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

app.set('trust proxy', true);   // корректный req.protocol за прокси Render/Heroku (для абсолютных URL в /api)


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

// ===== REST API (read-only JSON для мобильного/внешнего клиента) =====

// CORS + no-cache для всех /api роутов
app.use('/api', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Cache-Control', 'no-store');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

// Сырая OpenAPI спека (для кодогенерации клиента) и Swagger UI.
app.get('/api/openapi.json', function (req, res) {
    res.json(openapiSpec);
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, {
    customSiteTitle: 'Portfolio API — Swagger UI'
}));

app.get('/api/author', function (req, res) {
    var a = JSON.parse(JSON.stringify(authorJson));     // копия, чтобы не ломать относительные пути в EJS
    a.avatar = absUrl(req, a.avatar);                   // age уже посчитан числом при старте
    a.pdf = absUrl(req, a.pdf);
    a.pdf_cv = absUrl(req, a.pdf_cv);
    res.json(a);
});

app.get('/api/skills', function (req, res) {
    res.json(skillsJson);
});

app.get('/api/educations', function (req, res) {
    var list = JSON.parse(JSON.stringify(educationsJson));
    list.forEach(function (e) { e.logo = absUrl(req, e.logo); });
    res.json(list);
});

app.get('/api/categories', function (req, res) {
    res.json(categoryJson);
});

app.get('/api/works', function (req, res) {
    res.json(worksWithAbsUrls(req));
});

// Плоский список всех проектов — удобно для грида в мобильном клиенте.
// Фильтр: /api/projects?category=category-20
app.get('/api/projects', function (req, res) {
    var category = req.query.category;
    var projects = [];
    worksWithAbsUrls(req).forEach(function (w) {
        (w.projects || []).forEach(function (p) {
            if (p.enable === false) {
                return;
            }
            if (category && (p.category || []).indexOf(category) === -1) {
                return;
            }
            p.company = w.name;             // откуда проект
            projects.push(p);
        });
    });
    res.json(projects);
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

// Делает относительный путь абсолютным URL (http(s)://host/...).
// Полные ссылки (http/https) и data: возвращаются как есть.
function absUrl(req, p) {
    if (!p || /^(https?:)?\/\//i.test(p) || /^data:/i.test(p)) {
        return p;
    }
    var base = req.protocol + '://' + req.get('host') + '/';
    return base + String(p).replace(/^\/+/, '');
}

// Копия works с абсолютными URL у логотипов и картинок проектов.
function worksWithAbsUrls(req) {
    var works = JSON.parse(JSON.stringify(workJson));
    works.forEach(function (w) {
        w.logo = absUrl(req, w.logo);
        (w.projects || []).forEach(function (p) {
            p.image_main = absUrl(req, p.image_main);
            p.image_all = absUrl(req, p.image_all);
        });
    });
    return works;
}

function getYearDiffWithMonth(startDate, endDate) {
    const ms = endDate.getTime() - startDate.getTime();
  
    const date = new Date(ms);
  
    return Math.abs(date.getUTCFullYear() - 1970);
  }