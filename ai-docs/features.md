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

## 5. Accessibility / agent-navigability

A pass to make the accessibility tree cleaner for screen readers AND for
AI browser agents (which increasingly read the a11y tree instead of
pixels). Constraint: **no visual change, no functional change** — so only
ARIA/role attributes and an off-screen skip link were added; no theme tags
were swapped and no theme CSS/JS selectors were touched (the theme keys off
classes/`data-*`, never `role`/`aria-*`).

- **Skip link** (`templates/index.ejs` + `public/assets/css/a11y.css`):
  "Skip to main content" → `#app`; sits off-screen (`left:-9999px`) until
  keyboard-focused, so normal rendering is unchanged. `<main id="app">` got
  `tabindex="-1"` as the focus target; its focus outline is suppressed.
- **`role="button"`** on JS-control anchors that don't navigate (the two
  menu/dropdown toggles, the portfolio filters, the modal Cancel, and the
  contact reveal links); `aria-haspopup="true"` on the two menu toggles.
  The "Live Demo" modal links stay links (JS gives them real hrefs).
- **`aria-level="4"`** on the `<h5>` items (personal-info fields + the mini
  profile subtitle) so the heading hierarchy is contiguous (h3 → h4)
  without changing the `<h5>` tag or its styling.
- **`aria-hidden="true"`** on the decorative preloader and the icon `<i>`s
  inside the menu toggles.
- `public/assets/js/contact-protect.js`: on reveal it now also drops the
  `role="button"` (the element becomes a real `tel:`/`mailto:` link) and
  updates `aria-label` to the revealed value — keeping the tree honest in
  both states.

Verified in a headless Chromium (Playwright): screenshot unchanged, skip
link off-screen until focus, portfolio filtering still works, contact
reveal still works (mask → real number, `tel:` href, role removed), and no
new JS errors. (A pre-existing `ymaps is not defined` from the external
Yandex Maps script is unrelated.)

## 6. Housekeeping

- `npm audit fix` → 0 vulnerabilities (no breaking bumps needed).
- `node_modules` untracked (was gitignored yet partially committed with
  stale/vulnerable files).
- Heroku boilerplate removed: deleted `app.json`; renamed the package from
  the Heroku sample name to `alex-d-resume`; fixed `repository.url`;
  dropped the `heroku` keyword. `Procfile` kept (Render can use it). The
  word "Heroku" in the résumé text is real content and was left alone.
- `index.js` refactored into a thin routing layer (logic moved to
  `lib/data.js` + `lib/contacts.js`).

## 7. Page-load performance

Constraints for this pass: **don't edit the theme CSS**, and **keep the
`public/images/projects/_png` masters** (they're source art for future
images).

- **Removed dead Universal Analytics (`ga.js`)** from the page head. UA was
  shut down by Google on 2023-07-01, so that inline injector + external
  `google-analytics.com/ga.js` request did nothing. GA4 (`gtag.js`) stays.
- **Removed jwplayer** (71 KB JS + a 196 KB `.swf`): its setup only runs on
  `.player` elements, of which this page has none — it loaded and idled.
  The script tag and the `public/assets/libs/jwplayer/` folder are gone.
- **Removed `roboto-bak`** (~1.9 MB): a duplicate Roboto font folder that
  nothing referenced.
- **Lazy-loaded Yandex Maps**: the heavy external maps SDK + `my_poi.js`
  (which needs `ymaps` to already exist) used to load on every page view.
  They're now injected only when the Contact-section `#map` nears the
  viewport (IntersectionObserver, `300px` rootMargin; immediate fallback if
  IO is unavailable). Verified: 0 map requests on initial load, 1 after
  scrolling to Contact — and the initial-load `ymaps is not defined` error
  is gone.

Known remaining levers (not done): image optimization (re-compress the
served `.jpg` in place — no CSS/reference changes — keeping `_png`
masters), CSS purge for materialize/animate (deferred: CSS is off-limits
for now), font subsetting.
