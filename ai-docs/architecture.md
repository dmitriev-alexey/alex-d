# Architecture

## Overview

A minimal server-rendered site: Express serves one EJS page and a
generated PDF, both fed by JSON content loaded once at startup. There is
no database and no client-side data fetching — the content is baked into
the process memory at boot.

## Startup flow

1. `index.js` requires `lib/resumePdf` and calls
   `require('./lib/data').load()` → returns the full content object.
2. `lib/data.js`:
   - reads each `data/*.json.file` (paths resolved via
     `path.join(__dirname, '..', 'data')`, not the process cwd),
   - enriches the `author` object (see data-model.md → derived fields):
     `age`, `experienceYears`, resolved `myStory`, and the masked/
     obfuscated contact fields (via `lib/contacts.js`),
   - returns `{ author, skills, works, educations, categories, manifest }`.
3. `index.js` wires middleware (`compression`, `express-minify`,
   `serve-static` on `public/` with custom cache headers,
   `express-robots-txt`) and registers routes.
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
- `GET /sitemap*` → sends `sitemap.xml`.
- Fallthrough middleware → logs the URL and renders `error404`.

## Why the modules are split this way

`index.js` was originally a single file mixing file reads, business logic,
helper functions and routing, all around a shared mutable `authorJson`.
It was split so `index.js` is only routing/wiring, `lib/data.js` owns
loading + derivation, and `lib/contacts.js` owns the contact-masking
rules. This is organizational only — no runtime/perf change, since data
is still loaded once and served from memory.

## Performance note

Server-side rendering is cheap here; the perceived load time is dominated
by the **front-end theme assets** (~5.6 MB under `public/assets/libs`) and
duplicate analytics, not by the Node layer. Any real speed work belongs on
the client/asset side, not in these modules. See CLAUDE.md → follow-ups.
