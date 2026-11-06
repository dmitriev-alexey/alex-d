'use strict';

var express = require('express');
var robots = require('express-robots-txt');
var path = require('path');
var serveStatic = require('serve-static');

var compression = require('compression');
var minify = require('express-minify');

var swaggerUi = require('swagger-ui-express');
var openapiSpec = require('./openapi');

var resumePdf = require('./lib/resumePdf');
var llmsTxt = require('./lib/llmsTxt');

// All site content is loaded from data/ and enriched once at startup;
// see lib/data.js (data-loading) and lib/contacts.js (contact masking).
var data = require('./lib/data').load();

// Built once from the data - it has no per-request or time-sensitive parts.
var llmsTxtBody = llmsTxt.build(data);

var app = express();

// process.env.NODE_ENV = 'dev';
process.env.NODE_ENV = 'production';

var ejs = require('ejs');

app.set('views', __dirname + '/templates');
app.set('view engine', 'ejs');

app.set('port', (process.env.PORT || 6000));

app.set('trust proxy', true);   // корректный req.protocol за прокси Render (для абсолютных URL в /api)


// Baseline security headers on every response (set before anything else so
// static assets, the rendered page and the PDF all get them). No CSP here -
// the page relies on inline scripts, so a real CSP needs separate care.
app.use(function (req, res, next) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // HSTS: honored only over HTTPS (Render terminates TLS). 180 days,
    // conservative - no includeSubDomains / preload.
    res.setHeader('Strict-Transport-Security', 'max-age=15552000');
    next();
});

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
    res.send(data.manifest);
});

app.get('/llms.txt', function (req, res) {
    res.type('text/plain; charset=utf-8');
    res.send(llmsTxtBody);
});

app.get('/resume.pdf', function (request, response) {
    // Generated fresh on every request - no caching. The same generatedAt
    // moment is used both inside the document (footer/metadata, see
    // lib/resumePdf.js) and in the downloaded file name, so they agree.
    var generatedAt = new Date();

    resumePdf.generateResumePdfBuffer({
        author: data.author,
        skills: data.skills,
        works: data.works,
        educations: data.educations,
        generatedAt: generatedAt
    }).then(function (buffer) {
        var filename = data.author.name.replace(/\s+/g, '') +
            '_Resume_' + resumePdf.formatFilenameTimestamp(generatedAt) + '.pdf';

        response.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'inline; filename="' + filename + '"',
            // Every request regenerates the PDF with a fresh timestamp - make
            // sure the browser never serves a stale copy from its own cache
            // instead of hitting this route again.
            'Cache-Control': 'no-store, no-cache, must-revalidate, private',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        response.send(buffer);
    }).catch(function (err) {
        console.log("Failed to generate resume.pdf: " + err.message);
        response.status(500).send('Resume PDF is temporarily unavailable.');
    });
});

app.get('/', function (request, response) {
    // The rendered HTML (unlike static assets) had no Cache-Control; cache it
    // for an hour, matching setCustomCacheControl's intent for text/html.
    response.set('Cache-Control', 'public, max-age=3600');
    response.render("index", {
        author: data.author,
        skills: data.skills,
        works: data.works,
        educations: data.educations,
        categories: data.categories
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
// Ассеты Swagger UI уже минифицированы; повторная обработка через
// express-minify (app.use(minify)) на слабой CPU Render вешает отдачу
// swagger-ui-bundle.js. Отключаем minify для всех /api-docs ответов.
app.use('/api-docs', function (req, res, next) {
    res.minifyOptions = { enabled: false };
    next();
}, swaggerUi.serve, swaggerUi.setup(openapiSpec, {
    customSiteTitle: 'Portfolio API — Swagger UI'
}));

app.get('/api/author', function (req, res) {
    var a = data.author;
    // Отдаём только публичные поля. Сырые phone/email НЕ раскрываем - тот же
    // анти-скрейпинг, что и на странице (см. lib/contacts.js); наружу идут
    // только маскированные версии.
    res.json({
        avatar: absUrl(req, a.avatar),
        name: a.name,
        age: a.age,
        experienceYears: a.experienceYears,
        address: a.address,
        site: a.site,
        pdf: absUrl(req, a.pdf),
        pdf_cv: absUrl(req, a.pdf_cv),
        phoneMasked: a.phoneMasked,
        emailMasked: a.emailMasked,
        myStory: a.myStory,
        social: a.social
    });
});

app.get('/api/skills', function (req, res) {
    res.json(data.skills);
});

app.get('/api/educations', function (req, res) {
    var list = JSON.parse(JSON.stringify(data.educations));
    list.forEach(function (e) { e.logo = absUrl(req, e.logo); });
    res.json(list);
});

app.get('/api/categories', function (req, res) {
    res.json(data.categories);
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

// Копия data.works с абсолютными URL у логотипов и картинок проектов.
function worksWithAbsUrls(req) {
    var works = JSON.parse(JSON.stringify(data.works));
    works.forEach(function (w) {
        w.logo = absUrl(req, w.logo);
        (w.projects || []).forEach(function (p) {
            p.image_main = absUrl(req, p.image_main);
            p.image_all = absUrl(req, p.image_all);
        });
    });
    return works;
}
