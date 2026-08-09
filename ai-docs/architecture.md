# Architecture

## Overview

A minimal server-rendered site: Express serves one EJS page and a
generated PDF, both fed by JSON content loaded once at startup. There is
no database and no client-side data fetching — the content is baked into
the process memory at boot.

## Startup flow

1. `index.js` requires `lib/resumePdf` + `lib/llmsTxt` and calls
   `require('./lib/data').load()` → returns the full content object.
2. `lib/data.js`:
   - reads each `data/*.json.file` (paths resolved via
     `path.join(__dirname, '..', 'data')`, not the process cwd),
   - enriches the `author` object (see data-model.md → derived fields):
     `age`, `experienceYears`, resolved `myStory`, the masked/obfuscated
     contact fields (via `lib/contacts.js`), and `structuredData` (JSON-LD),
   - returns `{ author, skills, works, educations, categories, manifest }`.
3. `index.js` builds the `/llms.txt` body once (`llmsTxt.build(data)`),
   wires middleware (`compression`, `express-minify`, `serve-static` on
   `public/` with custom cache headers, `express-robots-txt`) and registers
   routes.
4. Listens on `process.env.PORT || 6000`.

All of this happens once. Requests never re-read the filesystem for
content (the only per-request file-ish work is building the PDF buffer).

## Request handling

- `GET /` → `res.render('index', { author, skills, works, educations,
  categories })`. The template renders the whole single-page site.
- `GET /resume.pdf` → stamps one `generatedAt = new Date()`, calls
  `resumePdf.generateResumePdfBuffer({...data, generatedAt})`, sets
  `Content-Disposition` with a timestamped filename and **no-cache**
  headers, and sends the buffer. Regenerated on every request (see
  features.md).
- `GET /manifest*` → sends `data.manifest` as `application/json`.
- `GET /llms.txt` → sends the prebuilt `llmsTxtBody` as `text/plain`.
- `GET /sitemap*` → sends `sitemap.xml`.
- Fallthrough middleware → logs the URL and renders `error404`.

The rendered page also lazy-loads the Yandex Maps SDK: an inline
IntersectionObserver injects the maps script + `my_poi.js` only when the
Contact `#map` nears the viewport, keeping it off the initial load.

## Why the modules are split this way

`index.js` was originally a single file mixing file reads, business logic,
helper functions and routing, all around a shared mutable `authorJson`.
It was split so `index.js` is only routing/wiring, `lib/data.js` owns
loading + derivation, and `lib/contacts.js` owns the contact-masking
rules. This is organizational only — no runtime/perf change, since data
is still loaded once and served from memory.

## Performance note

Server-side rendering is cheap here; load time is dominated by front-end
assets, not the Node layer. A perf pass already removed dead analytics
(`ga.js`) and jwplayer, lazy-loaded Yandex Maps, and optimized the served
JPEGs (~30%). The **biggest remaining lever is the theme CSS**
(`materialize.min.css` 172 KB + `animate.min.css` 53 KB via PurgeCSS) —
currently blocked by the "don't edit CSS" constraint. See features.md §7
and CLAUDE.md → follow-ups.
