# Data model

All site content lives in `data/*.json.file` (JSON despite the extension;
non-public — see CLAUDE.md gotchas). Loaded once by `lib/data.js`. Do not
edit these files without an explicit request from the user.

Images/logos referenced below are paths relative to `public/` (e.g.
`images/...`), which IS served statically.

## author.json.file (object)

Raw fields:

| Field | Meaning |
|-------|---------|
| `avatar` | Avatar image path |
| `name` | Full name |
| `phone` | Phone (plaintext — masked before it reaches the page) |
| `email` | Email (plaintext — masked before it reaches the page) |
| `age` | **Birth date** string, e.g. `"1987-08-17"` (converted to a number of years at load) |
| `address` | City, country |
| `site` | Public site URL |
| `pdf` | Path to the manual "About Projects" PDF in `public/docs/` |
| `pdf_cv` | Path to the manual CV PDF in `public/docs/` |
| `experienceStartDate` | Career start date, e.g. `"2008-01-01"` (drives years-of-experience) |
| `myStory` | Array of "About" paragraphs; may embed `"\n"` for line breaks and the token `{{years}}` |
| `social` | `{ facebook, twitter, linkedin }` URLs |

Fields **derived at load** (added by `lib/data.js`, present on the object
handed to the template and the PDF — never hardcode these):

| Field | How it's derived |
|-------|------------------|
| `age` | overwritten: whole years between the birth date and now |
| `experienceYears` | whole years between `experienceStartDate` and now |
| `myStory` | each paragraph's `{{years}}` replaced with `experienceYears` |
| `phoneMasked` | e.g. `+375 25 *** ** 93` |
| `emailMasked` | e.g. `d**************@gmail.com` |
| `phoneObfuscated` | reversed-then-base64 phone (decoded client-side on click) |
| `emailObfuscated` | reversed-then-base64 email |
| `structuredData` | schema.org `Person` JSON-LD string (name, jobTitle, url, image, `sameAs` socials, city/country) — **no phone/email** — emitted in the page `<head>` |

## skills.json.file (array)

`[{ name, level }]` — `level` is a percentage string like `"90%"`.
Rendered as bars on the page and in the PDF (parsed to an int for width).

## works.json.file (array)

Each entry:

| Field | Meaning |
|-------|---------|
| `name` | Company |
| `type` | e.g. `"FULL-TIME"` |
| `period` | e.g. `"03.2021 - Present day"` |
| `position` | Role/title |
| `logo` | Company logo image path |
| `main_specialization`, `primary_functions` | Short descriptive lines |
| `projects` | Array of project objects (below) |

Project object: `{ enable, name, title, content, image_main, demo_link,
image_all, category: ["category-N", ...] }`. `enable` gates whether the
project shows in the portfolio grid / PDF; `category` values map to the
portfolio filter (see below). `name` is the label (often prefixed `• `).

## educations.json.file (array)

`{ name, period, logo, position0, position1?, desc0, desc1? }` —
`position1` and `desc1` are optional (guarded in template and PDF).

## projects_category.json.file (array)

Portfolio filter buttons: `{ name, data_target, active? }`. `data_target`
is a CSS selector like `".category-2"` (or `"*"` for All) matched against
the `category` arrays on projects. `active` marks the default-selected
filter. Used only by the page, not the PDF.

## manifest.json.file (object)

A PWA web app manifest (`name`, `short_name`, `icons`, `start_url`,
`theme_color`, `background_color`, `display`). Served via `GET /manifest*`.

## Consumers

- **Page** (`templates/index.ejs`): author, skills, works, educations,
  categories.
- **PDF** (`lib/resumePdf.js`): author (incl. `myStory`), skills, works,
  educations. Not categories/manifest.
- **`/manifest*` route**: manifest only.
