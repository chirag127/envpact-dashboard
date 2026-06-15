# Changelog

## [0.2.0] - 2026-06-16

### Security

- **AUDIT #1** — `getVaultRepo` now throws when the GitHub Contents
  API reports the vault repo is not private. The dashboard's existing
  error rendering surfaces the message `Vault repo <owner>/<repo> is
  PUBLIC. Refusing to load secrets — make the repo private on GitHub
  before continuing.` instead of silently loading plaintext secrets
  from a public repo.

### Changed (BREAKING but correct)

- **AUDIT #6** — The browser port now omits encrypted (`enc:*`) values
  from the `resolved` map returned by `resolveProject`. The Projects
  table renders a `decryption unsupported (N)` badge next to each
  project that has encrypted keys. The `.env` download handler shows
  an explanatory alert and appends `# <KEY>: decryption unsupported —
  use envpact-cli` comment lines instead of the ciphertext. This is
  an intentional divergence from the CLI port's resolver semantics —
  the browser has no GPG, and shipping ciphertext into a downloaded
  `.env` is worse than omitting it.

## [0.1.0] - 2026-06-15

### Added

- Initial release of envpact-dashboard.
- Astro static site, no backend.
- GitHub OAuth Device Flow authentication.
- Projects table with key counts + environment badges.
- Shared Secrets table (values masked).
- Per-project `.env` download.
- Cloudflare Pages deployment workflow.
- Bit-for-bit identical resolver semantics with envpact-cli.

[0.1.0]: https://github.com/chirag127/envpact-dashboard/releases/tag/v0.1.0
