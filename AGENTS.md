# AGENTS.md — envpact-dashboard

## Project Context

Astro static site for managing the envpact vault visually. Pure
client-side — no backend, no server functions (the only Pages
Functions are the OAuth proxy in `functions/api/auth/`). Hosted on
Cloudflare Pages + custom domain.

The dashboard is the read-mostly surface of the envpact ecosystem.
It shows vault state (projects, shared secrets, last-modified
timestamps) and supports edits via the GitHub Contents API. It
does NOT do per-key pull/push — that requires a local `.env` and
a `.env.example.lock` sidecar, which only envpact-cli /
envpact-mcp / envpact-vscode have access to.

## Architecture

- Vault schema **v3** (flat, single-environment, per-key
  `_modified_at` timestamps for conflict detection elsewhere). v1
  and v2 vaults are auto-upgraded in memory on read and silently
  persisted as v3 on the next edit (per SHARED_SPEC §1.4).
- **Astro 5** static output (`output: 'static'`).
- **GitHub OAuth Device Flow** for auth (no client secret needed).
  Pages Functions proxy `/api/auth/device` and `/api/auth/token` so
  the browser stays same-origin.
- **Vanilla JS** scripts in `public/scripts/` (no framework runtime).
- All state in `sessionStorage` — never `localStorage`.
- Every API call goes directly from browser to `api.github.com`.

## Key Files

- `src/pages/index.astro` — single-page shell + `<style is:global>`.
- `public/scripts/index.js` — UI orchestration (projects table,
  shared table, per-key status panels, .env download, global
  .env download button).
- `public/scripts/auth.js` — GitHub OAuth Device Flow.
- `public/scripts/vault.js` — Contents API client (read with
  upgradeVault auto-upgrade, commit with v3-shape writes).
- `public/scripts/resolver.js` — v3 resolver, upgradeVault,
  maskValue, formatRelative, latestModifiedAt.
- `public/scripts/timestamps.js` — `formatTimestamp(iso) →
  {utc, ist}`. IST is host-TZ independent (forced
  `Asia/Kolkata`). Per SHARED_SPEC §1.5.
- `public/scripts/global-env.js` — `renderGlobalEnv(vault)` +
  `downloadGlobalEnv(vault)`. Walks `vault.shared.*`
  alphabetically, emits §5-quoted `KEY=value` lines, encrypted
  entries become decrypt-via-cli comments. Per SHARED_SPEC
  §1.6 + §5.1.
- `tests/resolver.test.js`, `tests/vault.test.js`,
  `tests/timestamps.test.js`, `tests/global-env.test.js` —
  Node `--test`.
- `astro.config.mjs` — static output config.
- `wrangler.toml` — Cloudflare Pages config.
- `functions/api/auth/{device,token}.ts` — OAuth proxy. Schema
  changes do NOT touch these.

## Conventions

- 100% static. No SSR. No server actions beyond the OAuth proxy.
- All scripts in `public/` (Astro doesn't transform them) so the
  ESM imports work at runtime without a build step on each load.
- Inline `<style is:global>` for everything (one CSS payload).
- All secret values masked in DOM — never rendered as text. Use
  `maskValue` from `resolver.js`.
- No third-party analytics, telemetry, or fonts.
- Zero new runtime deps. Astro is the only one.

## Testing

- `pnpm test` runs `node --test tests/*.test.js` (Node 18+).
- Mock `globalThis.fetch` to drive vault.js round-trips; resolver
  is pure and tested directly.
- Coverage target: ≥80% for resolver and vault modules.

## Development

```bash
pnpm install --ignore-scripts
pnpm run dev      # http://localhost:4321
pnpm run build    # output to dist/
pnpm run preview  # serve dist/
pnpm test
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
- NEVER render secret values to the DOM. Mask via `maskValue`.
- Set strict CSP via `_headers` file in `public/`.
- All API requests use HTTPS to api.github.com only.
- `getVaultRepo` refuses public repos (audit #1).
- `resolveProject` does NOT include `enc:*` values in `resolved`
  (audit #6) — they go into `result.encrypted[]` and the .env
  download appends comment lines pointing at envpact-cli.
