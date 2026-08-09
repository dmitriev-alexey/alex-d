# ai-docs — index

Navigation map for the alex-d résumé site, written for an AI assistant to
re-index the project quickly. Top-level memory is in the repo-root
[`CLAUDE.md`](../CLAUDE.md); this folder holds the detail.

## Documents

| Doc | Read it when you need to… |
|-----|---------------------------|
| [architecture.md](architecture.md) | Understand modules, startup flow, and how a request is served |
| [data-model.md](data-model.md) | Know the shape of each `data/*.json.file` and the fields derived at load |
| [features.md](features.md) | Work on the PDF, the contact anti-scraping, or the dynamic date fields |

## File map (where things live)

| Path | Responsibility |
|------|----------------|
| `index.js` | Express setup, middleware, routes: `/`, `/resume.pdf`, `/manifest*`, `/sitemap*`, 404. Thin — no data logic. |
| `lib/data.js` | `load()` reads every `data/*.json.file` once at startup and returns `{ author, skills, works, educations, categories, manifest }`, with the author enriched. |
| `lib/contacts.js` | `maskPhone`, `maskEmail`, `obfuscate` — used by `lib/data.js`; mirrored client-side by `public/assets/js/contact-protect.js`. |
| `lib/resumePdf.js` | `generateResumePdfBuffer(data)` and `formatFilenameTimestamp(date)` — the pdfmake document. |
| `lib/llmsTxt.js` | `build(data)` — the `/llms.txt` body (site summary for LLMs). |
| `templates/index.ejs` | The single rendered page (about, skills, experience, education, portfolio, testimonials, contact). |
| `templates/error404.ejs` | 404 page. |
| `data/*.json.file` | Site content (non-public). See data-model.md. |
| `public/assets/js/contact-protect.js` | Client decoder: reveals masked phone/email on click. |
| `public/assets/css/contact-protect.css` | Styling for the reveal links. |
| `public/assets/{libs,js,css,font}` | Purchased theme assets (heavy — see follow-ups). |
| `public/images`, `public/docs` | Images, and the two manually-authored PDFs (`DmitrievAlexeyCV.pdf`, `DmitrievAlexeyAboutProjects.pdf`). |
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
- Phone/email never appear raw in served HTML.
- Dynamic fields (`age`, `experienceYears`, resolved `myStory`) are
  computed in `lib/data.js`; never hardcode them.
- Develop on `dynamic_pdf`; `master` auto-deploys; `before_ai` is frozen.

_Keep this index and the sibling docs in sync when the structure changes._
