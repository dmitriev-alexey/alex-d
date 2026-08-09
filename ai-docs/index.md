# ai-docs — index

Navigation map for the alex-d résumé site, written for an AI assistant to
re-index the project quickly. Top-level memory is in the repo-root
[`CLAUDE.md`](../CLAUDE.md); this folder holds the detail.

## Documents

| Doc | Read it when you need to… |
|-----|---------------------------|
| [architecture.md](architecture.md) | Understand modules, startup flow, and how a request is served |
| [data-model.md](data-model.md) | Know the shape of each `data/*.json.file` and the fields derived at load |
| [features.md](features.md) | The intent behind every notable change — PDF, contact anti-scraping, dynamic dates, SEO/`llms.txt`, accessibility, housekeeping, performance |

## File map (where things live)

| Path | Responsibility |
|------|----------------|
| `index.js` | Express setup, middleware, routes: `/`, `/resume.pdf`, `/manifest*`, `/llms.txt`, `/sitemap*`, 404. Thin — no data logic. |
| `lib/data.js` | `load()` reads every `data/*.json.file` once at startup and returns `{ author, skills, works, educations, categories, manifest }`, with the author enriched. |
| `lib/contacts.js` | `maskPhone`, `maskEmail`, `obfuscate` — used by `lib/data.js`; mirrored client-side by `public/assets/js/contact-protect.js`. |
| `lib/resumePdf.js` | `generateResumePdfBuffer(data)` and `formatFilenameTimestamp(date)` — the pdfmake document. |
| `lib/llmsTxt.js` | `build(data)` — the `/llms.txt` body (site summary for LLMs). |
| `templates/index.ejs` | The single rendered page (about, skills, experience, education, portfolio, testimonials, contact). |
| `templates/error404.ejs` | 404 page. |
| `data/*.json.file` | Site content (non-public). See data-model.md. |
| `public/assets/js/contact-protect.js` | Client decoder: reveals masked phone/email on click (and swaps role→link). |
| `public/assets/css/contact-protect.css`, `a11y.css` | Site-specific CSS (reveal links; skip-link + focus). The only CSS we edit. |
| `public/assets/{libs,js,css,font}` | Purchased theme assets — **don't edit the theme CSS** (user constraint). |
| `public/images`, `public/docs` | Served images (`.jpg`, optimized in place), and the two manual PDFs (`DmitrievAlexeyCV.pdf`, `DmitrievAlexeyAboutProjects.pdf`). |
| `public/images/projects/_png` | **Source masters — keep, never serve/delete** (nothing links to it). |
| `robots.txt`, `sitemap.xml` | SEO files at repo root (robots served via `express-robots-txt`). |
| `Procfile` | `web: node index.js` — kept (Render can use it). |

## Routes

| Route | Serves |
|-------|--------|
| `GET /` | Renders `templates/index.ejs` with all data. |
| `GET /resume.pdf` | Freshly generated PDF (no cache), filename `<Name>_Resume_<UTC timestamp>.pdf`. |
| `GET /manifest*` | The PWA manifest JSON (from `data/manifest.json.file`). |
| `GET /llms.txt` | llms.txt site summary for LLMs (from `lib/llmsTxt.js`; no raw contacts). |
| `GET /sitemap*` | `sitemap.xml`. |
| `GET /json/*` | **404** by design — content is not publicly served. |

## Conventions to preserve

- Content files keep the `.json.file` extension and stay under `data/`.
- Phone/email never appear raw in served HTML, `/llms.txt`, or JSON-LD.
- Dynamic fields (`age`, `experienceYears`, resolved `myStory`,
  `structuredData`) are computed in `lib/data.js`; never hardcode them.
- Don't edit the theme CSS; keep the `_png` masters; optimize served
  images in place (no path/reference changes).
- Develop on `dynamic_pdf`; `master` auto-deploys; `before_ai` is frozen.

_Keep this index and the sibling docs in sync when the structure changes._
