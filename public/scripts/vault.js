/**
 * GitHub Contents API client — read & commit secrets.json
 * directly from the user's private vault repo.
 *
 * No backend. All requests go from the browser to api.github.com
 * with the user's session token.
 */

const GITHUB_API = 'https://api.github.com';

export async function getVaultRepo(token, owner, repo = 'envpact-secrets') {
  const r = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, {
    headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github+json' },
  });
  if (!r.ok) {
    if (r.status === 404) return null;
    throw new Error(`repo fetch failed: ${r.status}`);
  }
  const data = await r.json();
  if (data.private !== true) {
    throw new Error(`Vault repo ${owner}/${repo} is PUBLIC. Refusing to load secrets — make the repo private on GitHub before continuing.`);
  }
  return data;
}

export async function getSecretsFile(token, owner, repo = 'envpact-secrets') {
  const r = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/secrets.json`,
    {
      headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github+json' },
    }
  );
  if (!r.ok) {
    if (r.status === 404) return null;
    throw new Error(`secrets fetch failed: ${r.status}`);
  }
  const data = await r.json();
  return {
    sha: data.sha,
    content: JSON.parse(atob(data.content.replace(/\n/g, ''))),
  };
}

export async function commitSecretsFile(token, owner, repo, vault, sha, message) {
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(vault, null, 2) + '\n')));
  const body = {
    message: message || 'envpact-dashboard: update vault',
    content,
    sha,
    committer: { name: 'envpact-dashboard', email: 'envpact@local' },
  };
  const r = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/secrets.json`,
    {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );
  if (!r.ok) throw new Error(`commit failed: ${r.status} ${(await r.text()).slice(0, 200)}`);
  return await r.json();
}

export async function listVaultCommits(token, owner, repo = 'envpact-secrets', limit = 20) {
  const r = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/commits?path=secrets.json&per_page=${limit}`,
    { headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github+json' } }
  );
  if (!r.ok) return [];
  return await r.json();
}
