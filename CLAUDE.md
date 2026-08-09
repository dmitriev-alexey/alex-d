# CLAUDE.md

Project memory for Claude Code. Read this first; deeper detail lives in
[`ai-docs/`](ai-docs/index.md) (start at `ai-docs/index.md`).

## What this is

Personal résumé / portfolio site for **Alexey Dmitriev** — a small
Node.js + Express app that renders a single page (EJS) and generates a
résumé PDF on the fly, both from the same JSON content. Deployed on
Render at https://alex-d.onrender.com (auto-deploys from `master`).

## Tech stack

- Node.js (`engines: 18.x`) + Express 4
- EJS server-side templating (`templates/index.ejs`)
- `pdfmake` for server-side PDF generation
- `compression` (gzip) + `express-minify` (css/js minify), `serve-static`,
  `express-robots-txt`
- Front-end: a purchased theme (jQuery / Materialize / owl-carousel /
  jwplayer / Yandex Maps) under `public/assets/`

## Layout

```
index.js                 thin routing layer + middleware only
lib/data.js              loads & enriches all content from data/ (once, at startup)
lib/contacts.js          phone/email masking + obfuscation helpers
lib/resumePdf.js         builds the résumé PDF (pdfmake) from the data
data/*.json.file         site content (NON-public — see gotchas)
templates/index.ejs      the single rendered page
templates/error404.ejs   404 page
public/                  static assets, images, docs, favicon (served as-is)
ai-docs/                 detailed docs + navigation index
```

## How to run / verify

```
npm install          # deps are NOT committed (node_modules is gitignored)
npm start            # === node index.js, serves on PORT or 6000
```
Smoke test: `GET /` → 200, `GET /resume.pdf` → 200 (application/pdf),
`GET /manifest.json` → 200, `GET /llms.txt` → 200 (text/plain),
`GET /json/*` → **404** (must stay 404).

## Critical conventions & gotchas

- **Content lives in `data/`, NOT `public/`.** These files hold the
  plaintext phone/email. They were once under `public/json/` and got
  served raw (`GET /json/author.json.file` leaked contacts), defeating the
  contact protection. **Never move them back under `public/`.**
- **`.json.file` extension** is an existing convention for the content
  files — keep it; loaders in `lib/data.js` expect those names.
- **Contacts are never printed raw in the HTML.** `lib/contacts.js` masks
  them (`+375 25 *** ** 93`) and ships a reversed-base64 blob that
  `public/assets/js/contact-protect.js` decodes only on click. The PDF
  keeps plaintext contacts on purpose (fetched on request, not crawled).
- **The user asked NOT to edit the résumé data files casually.** `data/`
  edits happen only on explicit request. (Structural additions like
  `experienceStartDate` / `myStory` were done with explicit approval.)
- **Dynamic fields** (computed in `lib/data.js`, don't hardcode): `age`
  and `experienceYears` from birth/`experienceStartDate` dates; the
  `{{years}}` token in `author.myStory` is resolved once and shared by
  both the page and the PDF.
- **`node_modules` is gitignored and untracked** — rely on
  `package-lock.json` + install-on-build. Don't commit it.
- **Known dead code (left intentionally, not yet cleaned):** unused
  `var ejs` and `ensureSecure()` in `index.js`.

## Git / deploy workflow

- Develop on **`dynamic_pdf`**; commit & push there.
- **`before_ai`** is a frozen backup branch (state before this AI work) —
  **never touch it.**
- Merge to **`master`** only when the user says "подмержи" (merge). Pushing
  `master` triggers the Render deploy. Use `--no-ff` merges.
- After a merge, `node_modules` may get pruned from the working tree
  (it was historically tracked); run `npm install` locally before testing.

## Open follow-ups (not done)

- **Page-load speed** — the biggest real win: ~5.6 MB of theme `libs`,
  duplicate analytics (legacy `ga.js` + `gtag.js`), image optimization.
- Dead-code cleanup (`var ejs`, `ensureSecure`), unused static HTML in
  `public/` (`blog.html`, `single.html`, …).
- No tests / no config layer yet; `engines.node` pinned at 18.x (EOL-ish).
