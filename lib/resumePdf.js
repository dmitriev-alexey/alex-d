'use strict';

// Builds a resume PDF document straight from the same data objects that
// power the main page (author/skills/works/educations JSON), using pdfmake
// (declarative document definition on top of pdfkit).
//
// All resume content is Latin-only, so we rely on PDFKit's built-in
// standard fonts (Helvetica family) instead of embedding TTF files.

var PdfPrinter = require('pdfmake');

var fonts = {
    Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
    }
};

var ACCENT_COLOR = '#00bcd4';   // cyan accent used across the site (assets/css/main.css)
var TEXT_COLOR = '#333333';
var MUTED_COLOR = '#777777';
var LINE_COLOR = '#e0e0e0';

// Kept manually in sync with the "My Story" paragraph in templates/index.ejs
// (#about section). Not sourced from JSON - the project's data files are
// frozen, and this text is editorial copy, not resume data.
var MY_STORY_PARAGRAPHS = [
    "I'm a Mobile and Web Application developer. My experience is 14 years of creating web-based applications and applications for mobile devices.",
    'Deep knowledge in the most of common technology:',
    '• Android (1.6 - 16 SDK, NDK 11r - JNI) Android Tv, Android Wear',
    '• iOS (8-9)',
    '• Web Service (J2EE and Node.Js)',
    '     J2EE - Struts, Facelets, Spring, Hibernate.',
    '     Node.Js - Express and others frameworks.',
    '     JavaScript - jQuery and others frameworks.',
    '• Experience in work with cloud platforms: Google App Engine, Parse, Heroku, DigitalOcean.',
    '• Experience in work with databases: SQLite, MS SQL, Oracle, MySQL, NeDB, GreenDao, ObjectBox, Realm, Room.',
    '• Experience in work with analytics: Google Analytics, Fabric, other.',
    '• Experience in work with Social API: FB, Instagram, Vk, Twitter and other.',
    '• Experience in work with game-frameworks AndEngine and LibGDX.',
    'Experience in design and development large-scale distributed systems, as well as experience in management a small team (up to 5 people).',
    '• Manager tools: Atlassian Jira, Trello, Redmine.',
    '• Methodologies: Agile, SCRUM.'
];

function sectionTitle(text) {
    return { text: text, style: 'sectionTitle', margin: [0, 14, 0, 8] };
}

function buildHeader(author) {
    var contactLine = [author.phone, author.email, author.address, author.site]
        .filter(Boolean)
        .join('     •     ');

    return [
        { text: author.name, style: 'name' },
        { text: 'Mobile and Web Application Developer', style: 'tagline' },
        {
            text: contactLine,
            style: 'contact',
            margin: [0, 6, 0, 0]
        },
        {
            canvas: [{ type: 'line', x1: 0, y1: 10, x2: 515, y2: 10, lineWidth: 1, lineColor: LINE_COLOR }]
        }
    ];
}

function buildMyStory() {
    return [sectionTitle('My Story')].concat(
        MY_STORY_PARAGRAPHS.map(function (line) {
            return { text: line, style: 'body', margin: [0, 0, 0, 3] };
        })
    );
}

function skillBar(skill) {
    var barWidth = 150;
    var percent = parseInt(skill.level, 10) || 0;
    var filled = Math.max(0, Math.min(barWidth, Math.round((barWidth * percent) / 100)));

    return {
        unbreakable: true,
        margin: [0, 0, 0, 8],
        stack: [
            {
                columns: [
                    { text: skill.name, style: 'skillName', width: '*' },
                    { text: skill.level, style: 'skillLevel', width: 36, alignment: 'right' }
                ]
            },
            {
                margin: [0, 3, 0, 0],
                canvas: [
                    { type: 'rect', x: 0, y: 0, w: barWidth, h: 5, r: 2, color: LINE_COLOR },
                    { type: 'rect', x: 0, y: 0, w: filled, h: 5, r: 2, color: ACCENT_COLOR }
                ]
            }
        ]
    };
}

function buildSkills(skills) {
    var half = Math.ceil(skills.length / 2);
    var left = skills.slice(0, half);
    var right = skills.slice(half);

    return [
        sectionTitle('Skills'),
        {
            columnGap: 24,
            columns: [
                { width: '*', stack: left.map(skillBar) },
                { width: '*', stack: right.map(skillBar) }
            ]
        }
    ];
}

function buildWorkProjects(work) {
    var enabledProjects = (work.projects || []).filter(function (project) {
        return project.enable;
    });

    if (!enabledProjects.length) {
        return [];
    }

    return [{ text: 'Projects:', style: 'label', margin: [0, 5, 0, 2] }].concat(
        enabledProjects.map(function (project) {
            return { text: project.name, style: 'body' };
        })
    );
}

function buildWorkItem(work) {
    return {
        unbreakable: true,
        margin: [0, 0, 0, 12],
        stack: [
            {
                columns: [
                    { text: work.position, style: 'itemTitle', width: '*' },
                    { text: work.period, style: 'period', width: 140, alignment: 'right' }
                ]
            },
            { text: [work.name, work.type].filter(Boolean).join(', '), style: 'itemSubtitle' },
            { text: work.main_specialization, style: 'body', margin: [0, 4, 0, 0] },
            { text: work.primary_functions, style: 'body' }
        ].concat(buildWorkProjects(work))
    };
}

function buildExperience(works) {
    return [sectionTitle('Experience')].concat(works.map(buildWorkItem));
}

function buildEducationItem(education) {
    var position = [education.position0, education.position1].filter(Boolean).join(' — ');
    var desc = [education.desc0, education.desc1].filter(Boolean).join(' ');

    return {
        unbreakable: true,
        margin: [0, 0, 0, 10],
        stack: [
            {
                columns: [
                    { text: position, style: 'itemTitle', width: '*' },
                    { text: education.period, style: 'period', width: 140, alignment: 'right' }
                ]
            },
            { text: education.name, style: 'itemSubtitle' },
            { text: desc, style: 'body', margin: [0, 4, 0, 0] }
        ]
    };
}

function buildEducation(educations) {
    return [sectionTitle('Education')].concat(educations.map(buildEducationItem));
}

function pad(number) {
    return number < 10 ? '0' + number : '' + number;
}

function formatGeneratedAt(date) {
    return date.getUTCFullYear() + '-' + pad(date.getUTCMonth() + 1) + '-' + pad(date.getUTCDate()) +
        ' ' + pad(date.getUTCHours()) + ':' + pad(date.getUTCMinutes()) + ' UTC';
}

function buildGeneratedAt(date) {
    return {
        text: 'Generated on ' + formatGeneratedAt(date),
        style: 'generatedAt',
        alignment: 'right',
        margin: [0, 20, 0, 0]
    };
}

function getDocDefinition(data) {
    var author = data.author;
    var generatedAt = data.generatedAt || new Date();

    return {
        info: {
            title: author.name + ' - Resume',
            author: author.name
        },
        pageSize: 'A4',
        pageMargins: [40, 40, 40, 50],
        defaultStyle: {
            font: 'Helvetica',
            fontSize: 10,
            color: TEXT_COLOR
        },
        content: [].concat(
            buildHeader(author),
            buildMyStory(),
            buildSkills(data.skills),
            buildExperience(data.works),
            buildEducation(data.educations),
            [buildGeneratedAt(generatedAt)]
        ),
        styles: {
            name: { fontSize: 22, bold: true, color: TEXT_COLOR },
            tagline: { fontSize: 12, color: ACCENT_COLOR, margin: [0, 2, 0, 0] },
            contact: { fontSize: 9, color: MUTED_COLOR },
            sectionTitle: { fontSize: 14, bold: true, color: ACCENT_COLOR },
            label: { fontSize: 9, bold: true, color: MUTED_COLOR },
            body: { fontSize: 9.5, color: TEXT_COLOR, lineHeight: 1.2 },
            skillName: { fontSize: 9.5 },
            skillLevel: { fontSize: 9, color: MUTED_COLOR },
            itemTitle: { fontSize: 11, bold: true },
            itemSubtitle: { fontSize: 9.5, italics: true, color: MUTED_COLOR, margin: [0, 1, 0, 0] },
            period: { fontSize: 9, color: MUTED_COLOR },
            generatedAt: { fontSize: 8, italics: true, color: MUTED_COLOR }
        },
        footer: function (currentPage, pageCount) {
            return {
                margin: [40, 10, 40, 0],
                columns: [
                    { text: author.site, style: 'contact' },
                    { text: currentPage + ' / ' + pageCount, style: 'contact', alignment: 'right' }
                ]
            };
        }
    };
}

function generateResumePdfBuffer(data) {
    return new Promise(function (resolve, reject) {
        try {
            var printer = new PdfPrinter(fonts);
            var doc = printer.createPdfKitDocument(getDocDefinition(data));
            var chunks = [];

            doc.on('data', function (chunk) {
                chunks.push(chunk);
            });
            doc.on('end', function () {
                resolve(Buffer.concat(chunks));
            });
            doc.on('error', reject);

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = {
    generateResumePdfBuffer: generateResumePdfBuffer
};
