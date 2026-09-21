# Nampa Devils AI Scout

Starter architecture for the **Nampa Devils Hockey Club** prospect research workflow.

- **Frontend (GitHub Pages):** static scouting dashboard with seeded data and API fallback
- **Backend (Render):** Node.js/Express API with health, prospects, and AI research placeholder

## Project structure

- `src/` backend service
- `frontend/` static dashboard files for GitHub Pages
- `test/` API tests
- `render.yaml` Render service configuration
- `.github/workflows/deploy-pages.yml` GitHub Pages deployment workflow

## Data model

Each prospect includes:

- `name`, `position`, `birthYear`, `age`, `location`, `currentLeagueTeam`
- `height`, `weight` (when known)
- `sourceUrls`
- `scoutingNotes`, `strengths`, `developmentConcerns`
- `fitScores`: `skating`, `hockeyIQ`, `competeLevel`, `physicalTools`, `projectability`, `coachability`, `overallFit`

## Local setup

```bash
npm install
npm run dev
```

Backend runs on `http://localhost:3000`.

Run tests:

```bash
npm test
```

Build static frontend artifact:

```bash
npm run build
```

## Backend API

- `GET /health` basic service health
- `GET /api/prospects` seeded prospect list
  - optional query params:
    - `search` (text match)
    - `position` (must match known positions)
    - `sort=asc|desc` by `overallFit`
- `POST /api/research/prospect` AI integration placeholder
  - body: `{ "playerName": "...", "context": "..." }`
  - returns `501 not_implemented` until provider integration is added

## Environment variables

- `PORT` backend server port (default `3000`)
- `CORS_ORIGIN` allowed origin(s), comma-separated (wildcard `*` is ignored)
- `AI_RESEARCH_PROVIDER` provider identifier (placeholder)
- `AI_RESEARCH_API_KEY` secret key for future provider calls

Do not put secrets in frontend code or repository files.

## Render deployment

1. In Render, create a Blueprint or Web Service using this repository.
2. Use `render.yaml` (recommended) or equivalent settings:
   - Build command: `npm ci`
   - Start command: `npm start`
3. Set environment variables in Render dashboard:
   - `AI_RESEARCH_PROVIDER`
   - `AI_RESEARCH_API_KEY` (secret)
   - `CORS_ORIGIN` (for GitHub Pages origin)

## GitHub Pages deployment

Workflow file: `.github/workflows/deploy-pages.yml`

Repository settings required:

1. **Settings → Pages → Build and deployment**
2. Source: **GitHub Actions**

The Pages workflow also runs each Monday evening at 7:00 p.m. in the Eastern time zone.
Because GitHub Actions schedules are UTC-based, the workflow checks both possible UTC trigger
times and only publishes during the matching Monday 7:00 p.m. Eastern window.

The frontend uses relative asset paths, so it works under the repository subpath
(e.g. `https://jcampbell1870.github.io/nampa-devils-ai-scout/`) rather than only at domain root.

## Frontend behavior and fallback

- Starts with seeded local data immediately
- Attempts to load `/api/prospects` (or configured API base URL)
- If API is unavailable, continues using local seeded data gracefully
- The GitHub Pages build regenerates the seeded frontend prospect list from `src/data/prospects.js`
  so scheduled deployments publish the current backend prospect list

GitHub Pages now loads `frontend/config.js` before the app bundle. Update that file to point at
your deployed Render service:

```js
window.NAMPA_DEVILS_CONFIG = {
  apiBaseUrl: 'https://<your-render-service>.onrender.com'
};
```

## Ethics and responsible scouting use

This tool supports research organization. It does **not** replace qualified scouting,
player consent/privacy requirements, legal review, or league policy compliance.

## Future AI integration

The AI research endpoint is intentionally a placeholder. When adding a provider:

1. Keep all provider credentials in backend environment variables only.
2. Add request/response validation and timeout/retry handling.
3. Log safely without sensitive data.
4. Extend automated tests for provider error handling.
