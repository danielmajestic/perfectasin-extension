const AUTH_BASE = 'https://perfectasin.com/auth.html';
const API_BASE = 'https://api.titleperfect.app';
const TOKEN_EXPIRY_MS = 55 * 60 * 1000; // 55 minutes

// TODO(Kat): Replace with the Web client OAuth Client ID from the Firebase console
// Firebase project: titleperfect-e3a1c → Project Settings → General → Your apps → Web app → OAuth client ID
// Format: XXXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.apps.googleusercontent.com
const GOOGLE_CLIENT_ID = '119656431080-emhikh9mr0jf0a0guf8v7crfmlkgqihu.apps.googleusercontent.com';

interface StoredAuth {
  token: string;
  uid: string;
  email: string;
  expiresAt: number;
}

/**
 * Inline email/password sign-in — POST to backend, store returned token.
 * No Firebase SDK, no popup. Track 1 auth path.
 */
export async function signInWithEmail(email: string, password: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.message || data?.error || 'Incorrect email or password.');
  }

  const token = data.token ?? data.id_token ?? data.idToken ?? data.access_token;
  if (!token) throw new Error('Invalid response from server.');

  const uid: string = data.uid ?? data.user_id ?? data.userId ?? email;

  const stored: StoredAuth = {
    token,
    uid,
    email,
    expiresAt: Date.now() + TOKEN_EXPIRY_MS,
  };

  await chrome.storage.local.set({ tp_auth: stored });
}

/**
 * Google Sign-In via direct OAuth endpoint.
 * Uses launchWebAuthFlow → accounts.google.com (NOT auth.html).
 * Exchanges Google access_token for backend token via POST /api/auth/google.
 * Stores result in chrome.storage.local.
 *
 * Requires backend: POST /api/auth/google { access_token } → { token, uid, email }
 * Requires: GOOGLE_CLIENT_ID set to Web client OAuth ID from Firebase console.
 */
export async function signInWithGoogle(): Promise<void> {
  const redirectUri = `https://${chrome.runtime.id}.chromiumapp.org/`;

  const authUrl = new URL('https://accounts.google.com/o/oauth2/auth');
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('response_type', 'token');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', 'email profile');

  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      { url: authUrl.toString(), interactive: true },
      async (redirectUrl) => {
        if (chrome.runtime.lastError || !redirectUrl) {
          reject(new Error(chrome.runtime.lastError?.message ?? 'Authentication cancelled'));
          return;
        }

        // Access token is in the URL hash, not query params
        const hashParams = new URLSearchParams(new URL(redirectUrl).hash.slice(1));
        const accessToken = hashParams.get('access_token');
        if (!accessToken) {
          reject(new Error('No access token in Google response'));
          return;
        }

        // Exchange Google access token for backend token
        try {
          const res = await fetch(`${API_BASE}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: accessToken }),
          });

          const data = await res.json().catch(() => ({}));

          if (!res.ok || !data.token) {
            reject(new Error(data?.message || data?.error || 'Backend token exchange failed'));
            return;
          }

          const stored: StoredAuth = {
            token: data.token,
            uid: data.uid ?? data.user_id ?? '',
            email: data.email ?? '',
            expiresAt: Date.now() + TOKEN_EXPIRY_MS,
          };

          await chrome.storage.local.set({ tp_auth: stored });
          resolve();
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Google sign-in failed'));
        }
      },
    );
  });
}

/** @deprecated — was used to open auth.html via launchWebAuthFlow. Use signInWithGoogle() instead. */
export async function signIn(): Promise<void> {
  return signInWithGoogle();
}

/** Open sign-up page in a new tab (email sign-up handled on perfectasin.com). */
export async function signUp(): Promise<void> {
  chrome.tabs.create({ url: `${AUTH_BASE}?mode=signup` });
}

/** Open password-reset page in a new tab (no redirect needed). */
export function resetPassword(): void {
  chrome.tabs.create({ url: `${AUTH_BASE}?mode=reset` });
}

/** Clear stored auth data. */
export async function signOut(): Promise<void> {
  await chrome.storage.local.remove(['tp_auth']);
}

/** Return stored token, or null if missing/expired. */
export async function getStoredToken(): Promise<string | null> {
  const stored = await getStoredAuth();
  if (!stored) return null;
  if (Date.now() > stored.expiresAt) {
    await signOut();
    return null;
  }
  return stored.token;
}

/** Return true if a valid, non-expired token exists. */
export async function isAuthenticated(): Promise<boolean> {
  return (await getStoredToken()) !== null;
}

/** Return full auth state for use in React contexts. */
export async function getAuthState(): Promise<{
  authenticated: boolean;
  email: string | null;
  uid: string | null;
}> {
  const stored = await getStoredAuth();
  if (!stored || Date.now() > stored.expiresAt) {
    return { authenticated: false, email: null, uid: null };
  }
  return { authenticated: true, email: stored.email, uid: stored.uid };
}

// ─── Internals ────────────────────────────────────────────────────────────────

async function getStoredAuth(): Promise<StoredAuth | null> {
  const result = await chrome.storage.local.get(['tp_auth']);
  return (result.tp_auth as StoredAuth) ?? null;
}
