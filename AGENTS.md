# AGENTS.md — envpact-dashboard

## Project Context

Astro static site for managing the envpact vault visually. Pure
client-side — no backend, no server functions. Hosted on
Cloudflare Pages + custom domain.

## Architecture

- **Astro 5** static output (`output: 'static'`).
- **GitHub OAuth Device Flow** for auth (no client secret needed).
- **Vanilla JS** scripts in `public/scripts/` (no framework runtime).
- All state in `sessionStorage` — never `localStorage`.
- Every API call goes directly from browser to `api.github.com`.

## Key Files

- `src/pages/index.astro` — single-page app (HTML + inline script
  module that orchestrates everything).
- `public/scripts/auth.js` — GitHub OAuth Device Flow.
- `public/scripts/vault.js` — Contents API client (read + commit).
- `public/scripts/resolver.js` — client-side resolver (mirrors CLI).
- `astro.config.mjs` — static output config.
- `wrangler.toml` — Cloudflare Pages config.

## Conventions

- 100% static. No SSR. No server actions.
- All scripts in `public/` (Astro doesn't transform them) so the
  module imports work at runtime without a build step on each load.
- Inline `<style is:global>` for everything (one CSS payload).
- All secret values masked in DOM — never rendered as text.
- No third-party analytics, telemetry, or fonts.

## Development

```bash
npm install --ignore-scripts
npm run dev      # http://localhost:4321
npm run build    # output to dist/
npm run preview  # serve dist/
```

## Deploying

GitHub Actions (`deploy.yml`) deploys to Cloudflare Pages on every
push to `main`. Required secrets:

- `CLOUDFLARE_API_TOKEN` — token with Pages:Edit permission.
- `CLOUDFLARE_ACCOUNT_ID` — your account ID.

The dashboard URL is set in `astro.config.mjs` via `site:`.

## Security Rules

- NEVER persist tokens to `localStorage`. `sessionStorage` only.
- NEVER ship a client secret — device flow is public-client only.
- NEVER render secret values to the DOM. Mask with `****`.
- Set strict CSP via `_headers` file in `public/`.
- All API requests use HTTPS to api.github.com only.
