/**
 * GitHub OAuth Device Flow (no backend required).
 *
 * GitHub OAuth Apps with the device flow let us authenticate users
 * 100% client-side — perfect for a static Cloudflare Pages dashboard.
 *
 * Flow:
 *   1. POST https://github.com/login/device/code with client_id
 *      → returns user_code, verification_uri, device_code, interval.
 *   2. Show the user_code; open verification_uri.
 *   3. Poll https://github.com/login/oauth/access_token until granted.
 *
 * The access token is stored ONLY in sessionStorage (cleared on tab
 * close). It is never persisted in localStorage and never sent to
 * any third party — every API call goes directly to api.github.com.
 */

const CLIENT_ID =
  // Set at build time via wrangler / .env
  // (Astro exposes import.meta.env.PUBLIC_GITHUB_OAUTH_CLIENT_ID at build time;
  //  for runtime injection, the script-tag fallback below also works.)
  (typeof window !== 'undefined' && window.__ENVPACT_CLIENT_ID__) ||
  '';

const DEVICE_URL = 'https://github.com/login/device/code';
const TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_API = 'https://api.github.com';

const SESSION_TOKEN_KEY = 'envpact_gh_token';
const SESSION_USER_KEY = 'envpact_gh_user';

export function getStoredToken() {
  return sessionStorage.getItem(SESSION_TOKEN_KEY);
}

export function getStoredUser() {
  const raw = sessionStorage.getItem(SESSION_USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearAuth() {
  sessionStorage.removeItem(SESSION_TOKEN_KEY);
  sessionStorage.removeItem(SESSION_USER_KEY);
}

export async function startDeviceFlow(scope = 'repo') {
  if (!CLIENT_ID) {
    throw new Error(
      'GitHub OAuth client_id not configured. Set PUBLIC_GITHUB_OAUTH_CLIENT_ID at build time.'
    );
  }
  // Some browsers block CORS to github.com from arbitrary origins.
  // GitHub's device flow endpoints DO support CORS for origins
  // listed in your OAuth app's "Application URL". Configure
  // https://envpact.oriz.in there.
  const r = await fetch(DEVICE_URL, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: CLIENT_ID, scope }),
  });
  if (!r.ok) {
    throw new Error(`device flow start failed: ${r.status} ${r.statusText}`);
  }
  return await r.json();
}

export async function pollForToken(deviceCode, interval) {
  while (true) {
    await new Promise((res) => setTimeout(res, (interval || 5) * 1000));
    const r = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        device_code: deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      }),
    });
    const data = await r.json();
    if (data.access_token) return data.access_token;
    if (data.error === 'authorization_pending') continue;
    if (data.error === 'slow_down') {
      interval = (data.interval || interval) + 5;
      continue;
    }
    throw new Error(`device flow failed: ${data.error_description || data.error}`);
  }
}

export async function fetchUser(token) {
  const r = await fetch(`${GITHUB_API}/user`, {
    headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github+json' },
  });
  if (!r.ok) throw new Error(`user fetch failed: ${r.status}`);
  return await r.json();
}

export async function login() {
  const start = await startDeviceFlow('repo');
  // Show the code to the user
  const dialog = document.createElement('div');
  dialog.className = 'auth-dialog';
  dialog.innerHTML = `
    <div class="auth-card">
      <h2>Connect GitHub</h2>
      <p>Open <a href="${start.verification_uri}" target="_blank" rel="noopener">${start.verification_uri}</a> and enter:</p>
      <code class="auth-code">${start.user_code}</code>
      <p class="auth-hint">Waiting for authorisation… (token stays in this tab only)</p>
      <button class="auth-cancel">Cancel</button>
    </div>`;
  document.body.appendChild(dialog);
  dialog.querySelector('.auth-cancel').addEventListener('click', () => dialog.remove());

  try {
    const token = await pollForToken(start.device_code, start.interval);
    sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    const user = await fetchUser(token);
    sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify({
      login: user.login,
      name: user.name,
      avatar_url: user.avatar_url,
    }));
    dialog.remove();
    return { token, user };
  } catch (e) {
    dialog.remove();
    throw e;
  }
}
