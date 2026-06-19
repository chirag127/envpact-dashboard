# envpact-dashboard — documentation

> Browser dashboard for envpact at [envpact.oriz.in](https://envpact.oriz.in).
> Visual vault management — projects, shared keys, environments,
> rotation. Pure GitHub-API client; no envpact backend.

## What it does

- Renders every project and shared key in your vault as a sortable table
- Edit values inline; commit on save (one git commit per save, atomic)
- Rotate a shared key in one click; all referencing projects pick up the new value next read
- Per-environment editors for keys with `default / development / staging / production` slots
- Browser-only; closing the tab forgets your token (sessionStorage)

## How auth actually works

The dashboard uses **GitHub OAuth Device Flow**. When you click
"Connect GitHub":

1. Browser POSTs to `/api/auth/device` (a Cloudflare Pages Function
   on the same origin, served at envpact.oriz.in).
2. The Function forwards to `github.com/login/device/code`,
   server-side, with a public OAuth client_id baked into the
   deployment. The browser never sees that POST cross-origin —
   github.com doesn't send CORS headers, so this proxy is the only
   way to do device flow from a static site.
3. github.com returns a `device_code` + a short `user_code`. The
   dashboard shows `user_code`; you visit
   `github.com/login/device`, paste it, approve.
4. Browser polls `/api/auth/token` (same Function pattern) until
   github.com confirms; at that point the dashboard has an access
   token scoped to `repo`.
5. Token goes into `sessionStorage`. Closing the tab discards it.

The OAuth app is a **public** OAuth app (a single shared one for
the dashboard, like GitHub Desktop's, Linear's, Cursor's). It has
**no client secret** — device flow doesn't use one. Authorising the
app gives the dashboard `repo` scope on **your** GitHub account; the
dashboard immediately scopes itself further by only ever touching
`<you>/envpact-secrets`.

## What lives where

- `src/pages/index.astro` — the static HTML/CSS shell
- `public/scripts/index.js` — main UI logic (render, edit, save)
- `public/scripts/auth.js` — device flow + token mgmt
- `public/scripts/vault.js` — read/write `secrets.json` via GitHub API
- `public/scripts/resolver.js` — pure resolver (same logic as envpact-cli)
- `functions/api/auth/device.ts` — Cloudflare Pages Function: device-flow start
- `functions/api/auth/token.ts` — Cloudflare Pages Function: token poll
- `wrangler.toml` — `[vars] PUBLIC_GITHUB_OAUTH_CLIENT_ID = ...` (public; safe to commit)

## What's NOT here

- **No envpact server.** Every API call from the dashboard goes
  directly to `api.github.com`, signed with your token.
- **No database.** No analytics. No telemetry.
- **No client secret.** The OAuth client_id is the only credential;
  it's a public value that GitHub has explicitly designed to be safe
  to ship in a static page.
- **No persistent auth.** Closing the tab forgets your token.

## Threat model

| Attack | Why it doesn't work |
| :--- | :--- |
| Compromised envpact.oriz.in domain steals tokens | Token is in sessionStorage of the user's tab; an attacker who controls the static site could redirect device-flow approvals, but `github.com/login/device` is end-to-end with GitHub. |
| MITM steals secrets in transit | Cloudflare TLS to the dashboard; HTTPS to github.com on every API call. |
| Dashboard reads someone else's vault | The dashboard scopes vault reads to `<the-logged-in-user>/envpact-secrets`. There is no UI to point it at another user's repo. |
| The Pages Function is malicious | The Function only proxies `github.com/login/device/code` and `github.com/login/oauth/access_token`. It never sees your access token (the token-poll request includes the device code, not credentials). |

## See also

- [Umbrella docs](https://chirag127.github.io/envpact/)
- [Security model](https://chirag127.github.io/envpact/security.html)
