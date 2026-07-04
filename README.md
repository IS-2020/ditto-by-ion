# ditto by ION

[![CI](https://github.com/IS-2020/ditto-by-ion/actions/workflows/ci.yml/badge.svg)](https://github.com/IS-2020/ditto-by-ion/actions/workflows/ci.yml)
[![Live demo](https://img.shields.io/badge/demo-ditto--by--ion.vercel.app-gold)](https://ditto-by-ion.vercel.app/wizard)
[![License: MIT](LICENSE)](LICENSE)

Deterministic website compiler fork of [ditto.site](https://github.com/ion-design/ditto.site). Paste a public URL and get a self-contained Next.js App Router project — capture what the browser actually rendered, then emit byte-stable TypeScript output.

**Live UI:** [https://ditto-by-ion.vercel.app/wizard](https://ditto-by-ion.vercel.app/wizard)  
**Repo:** [github.com/IS-2020/ditto-by-ion](https://github.com/IS-2020/ditto-by-ion)

> Full Playwright capture runs on Vercel with extended timeouts; for production workloads (Postgres queue, R2 storage, multi-worker), use [Railway + Neon](docs/DEPLOY.md).

## First-run onboarding wizard

Open `/wizard` for the guided flow:

1. **Enter URL** — one site per project  
2. **Auto-scan** — discovers ~20 routes; **homepage clone starts immediately** (full quality)  
3. **Pick pages** — top 5 nav routes pre-checked; extra pages queue in the background  
4. **Build view** — 50/50 live vs clone (full-width clone + banner when embed is blocked), stage progress, timer, live file tree + editor, preview updates mirror → Next.js export  
5. **Audit** — pixel diff slider (live witness vs clone); route switcher after build  

Projects are saved in `localStorage` (`ditto_project`) so you can resume URL + selected routes. After onboarding, `/studio` opens the power-user clone UI.

Reset wizard: `localStorage.removeItem('ditto_onboarded')` then reload.

## What's different from upstream ditto.site

| Capability | Description |
|------------|-------------|
| **Onboarding wizard** | First-run flow with scan, route picker, side-by-side build, pixel audit |
| **Site scan API** | `POST /v1/scan` — crawl + route plan for UI checkboxes |
| **Route selection** | `selectedRoutes` on multi-page clones; homepage-first job queue |
| **Live WIP preview** | `/mirror-preview/` during generate; `/app-preview/` after build |
| **Pixel audit UI** | `GET /v1/clones/:id/audit` + diff PNGs per viewport |
| **Pattern catalog v5** | 159 SHA256-pinned patterns + mining scripts |
| **Tier G repair** | Audit-driven layout/style repair loop |
| **Dual deliverable** | Next.js app at `/` plus static HTML mirror at `/static/` |

## Quick start (local)

```bash
git clone https://github.com/IS-2020/ditto-by-ion.git
cd ditto-by-ion

npm ci
npx playwright install chromium
cd compiler/.harness && npm ci && cd ../..

PORT=8899 npm run dev:api
```

- **Wizard:** [http://localhost:8899/wizard](http://localhost:8899/wizard)  
- **Studio:** [http://localhost:8899/studio](http://localhost:8899/studio)

### Clone via API

```bash
# Scan routes
curl -sS -X POST "http://localhost:8899/v1/scan" \
  -H "content-type: application/json" \
  -d '{"url":"https://example.com/","maxRoutes":20}'

# Start clone (homepage only)
curl -sS -X POST "http://localhost:8899/v1/clones" \
  -H "content-type: application/json" \
  -d '{"url":"https://example.com/","options":{"qualityTier":"production","mode":"single"}}'

# Multi-page with selected routes
curl -sS -X POST "http://localhost:8899/v1/clones" \
  -H "content-type: application/json" \
  -d '{"url":"https://example.com/","options":{"qualityTier":"production","mode":"multi","selectedRoutes":["/","/about","/pricing"]}}'
```

Poll progress: `GET /v1/clones/:id/events` · Preview: `/v1/clones/:id/app-preview/`

## REST endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/v1/scan` | Crawl site + return route list for UI |
| `POST` | `/v1/clones` | Start a clone (queued; poll for result) |
| `GET` | `/v1/clones/:id` | Job status + `previewReady` |
| `GET` | `/v1/clones/:id/events` | Pipeline progress events |
| `GET` | `/v1/clones/:id/wip-files` | Generated files during build |
| `GET` | `/v1/clones/:id/wip-files/*` | Read one generated file (live editor) |
| `GET` | `/v1/clones/:id/app-preview/*` | Browsable Next.js static export |
| `GET` | `/v1/clones/:id/mirror-preview/*` | WIP static HTML mirror (mid-build) |
| `GET` | `/v1/clones/:id/audit` | Pixel audit summary + comparison URLs |
| `GET` | `/v1/clones/:id/bundle?format=tgz` | Download the whole app |

## Deploy

| Target | Use case |
|--------|----------|
| **[Vercel](https://ditto-by-ion.vercel.app)** (`vercel.json`) | Wizard UI + in-memory API demo |
| **[Railway + Neon + R2](docs/DEPLOY.md)** | Production queue, storage, workers |

```bash
# Vercel (from repo root)
vercel --prod
```

## CLI (compiler)

```bash
cd compiler
CATALOG_ONLY_HINTS=true npm run clone -- https://example.com/ --runs=../runs --viewports=1280 --validate
```

## Repository map

| Path | Purpose |
|------|---------|
| `compiler/` | Capture, inference, generation, validation |
| `packages/api/` | Hono REST API, wizard, studio UI, Vercel entry |
| `packages/core/` | Clone job runner, site scan, app preview |
| `api/index.ts` | Vercel serverless handler |
| `docs/` | Methodology, service, deployment |

## Responsible use

Use only where you have the right to inspect and copy the target. See [docs/RESPONSIBLE_USE.md](docs/RESPONSIBLE_USE.md).

## License

MIT © ion-design and contributors. See [LICENSE](LICENSE).
