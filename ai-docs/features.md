# Features added during the AI work

Chronological summary of the notable changes, so the intent behind the
current code is clear.

## 1. Dynamic résumé PDF (`GET /resume.pdf`)

- Built with **pdfmake** server-side (`lib/resumePdf.js`), from the same
  data objects that feed the page — no duplicated content.
- Standard PDFKit fonts (Helvetica family); no TTF embedding, because the
  content is Latin-only. If non-Latin (e.g. Cyrillic) content is ever
  added, fonts must be embedded or glyphs will break.
- Sections: header (name + contacts), My Story, Skills (percentage bars
  drawn as pdfmake canvas rects), Experience, Education, and a trailing
  "Generated on <UTC>" line. Work/education entries use `unbreakable: true`
  so a card isn't split across a page break.
- Accent color `#00bcd4` mirrors the site's cyan.
- A separate **"Generate PDF"** link was added to the nav dropdown in
  `templates/index.ejs`, alongside (not replacing) the existing manual
  "PDF CV" / "PDF Resume" links.

### Generation & caching semantics

- Regenerated **fresh on every request** (no in-memory cache), so it
  always reflects current data and the current timestamp.
- The route sets `Cache-Control: no-store, no-cache, must-revalidate,
  private` + `Pragma: no-cache` + `Expires: 0` so the **browser** never
  serves a stale copy. (Symptom that led to this: the browser was
  re-showing an old PDF.)
- One `generatedAt` per request is shared by the in-document footer, the
  PDF metadata (`info.subject`), and the download filename
  (`<Name>_Resume_<YYYY-MM-DD_HHMMUTC>.pdf` via `formatFilenameTimestamp`).

## 2. Contact anti-scraping (page only)

Goal: keep bots from harvesting phone/email, without hurting real users.
Chosen approach = **masking + reveal-on-click**, combined.

- `lib/contacts.js` produces, per contact: a **masked** display value and
  an **obfuscated** value (string reversed, then base64).
- The page (`templates/index.ejs`, About + Contact sections) shows the
  masked value inside a `.contact-protect` link carrying the obfuscated
  value in `data-value`; the real phone/email is **never in the markup**.
- `public/assets/js/contact-protect.js` decodes on click (base64 →
  reverse), swaps in the real text, and sets a real `tel:`/`mailto:` href.
  `public/assets/css/contact-protect.css` styles the reveal affordance.
- `itemprop="telephone"/"email"` microdata was removed (it invited
  structured scraping). Pre-existing empty `href=""` links were fixed.
- **Not real security** — the decode logic is public — but it stops the
  plain regex/HTML scrapers that are the bulk of harvesting traffic.
- The **PDF keeps plaintext contacts on purpose**: it's fetched on
  explicit request, not crawled alongside the page. (User decision.)

### The critical companion fix

Masking is only meaningful because the raw content is no longer public:
the `data/*.json.file` files were moved out of `public/json/` (where
`GET /json/author.json.file` had returned the plaintext contacts). `/json/*`
now 404s. **Do not move content back under `public/`.**

## 3. Content externalized & dynamic dates

- The "My Story" text and `experienceStartDate` were moved into
  `author.json.file` (single source for page + PDF).
- Years-of-experience is computed from `experienceStartDate` (from 2008)
  the same way age is computed from the birth date — via `yearsBetween`
  in `lib/data.js`. The `{{years}}` token in `myStory` is resolved once.

## 4. Discoverability / SEO

- **`GET /llms.txt`** (https://llmstxt.org): a site summary for LLMs, built
  once at startup from data (`lib/llmsTxt.js`) — name, location, years of
  experience, résumé/CV PDF links, top skills, social links. **No raw
  contacts** (it's bot-facing, same stance as the page).
- **Canonical**: `<link rel="canonical" href="{author.site}">` in the head
  — consolidates www/non-www and duplicate URLs for Google.
- **Structured data**: schema.org `Person` JSON-LD in the head, built in
  `lib/data.js` as `author.structuredData` (name, jobTitle, url, image,
  `sameAs` socials, city/country). No phone/email — this replaces the
  `itemprop` microdata that was removed during contact protection.
- **robots.txt**: removed a stale, malformed `Host : alex-d.cyclic.app`
  line (old Cyclic domain; `Host` is a non-standard directive Google
  ignores). Keeps `Allow: /` + the sitemap reference.
- **sitemap.xml**: refreshed `lastmod` for the homepage and added the
  `/resume.pdf` URL; the two manually-authored PDFs keep their real dates.

www redirect: intentionally none at the app level — the site runs on the
`alex-d.onrender.com` apex with no www/custom domain, and on Render such
redirects belong at the platform/DNS layer, not in Express.

## 5. Housekeeping

- `npm audit fix` → 0 vulnerabilities (no breaking bumps needed).
- `node_modules` untracked (was gitignored yet partially committed with
  stale/vulnerable files).
- Heroku boilerplate removed: deleted `app.json`; renamed the package from
  the Heroku sample name to `alex-d-resume`; fixed `repository.url`;
  dropped the `heroku` keyword. `Procfile` kept (Render can use it). The
  word "Heroku" in the résumé text is real content and was left alone.
- `index.js` refactored into a thin routing layer (logic moved to
  `lib/data.js` + `lib/contacts.js`).
