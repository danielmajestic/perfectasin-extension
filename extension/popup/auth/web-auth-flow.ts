const AUTH_BASE = 'https://perfectasin.com/auth.html';
const TOKEN_EXPIRY_MS = 55 * 60 * 1000; // 55 minutes


interface StoredAuth {
  token: string;
  uid: string;
  email: string;
  expiresAt: number;
  refreshToken?: string;
  authMethod?: 'email' | 'google';
}

const FIREBASE_API_KEY = 'AIzaSyD9bhupwn_19wSDYDdoaPYAfbOCzBN-TFQ';
const FIREBASE_SIGN_IN_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
const FIREBASE_TOKEN_REFRESH_URL = `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`;

/**
 * Inline email/password sign-in via Firebase REST API (no SDK).
 * Stores the idToken the same way Google OAuth does.
 */
export async function signInWithEmail(email: string, password: string): Promise<void> {
  const res = await fetch(FIREBASE_SIGN_IN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Firebase REST API error messages
    const code = data?.error?.message || '';
    if (code === 'EMAIL_NOT_FOUND' || code === 'INVALID_PASSWORD' || code === 'INVALID_LOGIN_CREDENTIALS') {
      throw new Error('Incorrect email or password.');
    }
    if (code === 'USER_DISABLED') {
      throw new Error('This account has been disabled.');
    }
    if (code.startsWith('TOO_MANY_ATTEMPTS')) {
      throw new Error('Too many failed attempts. Please try again later.');
    }
    throw new Error(data?.error?.message || 'Sign-in failed. Please try again.');
  }

  const token = data.idToken;
  if (!token) throw new Error('Invalid response from server.');

  const uid: string = data.localId || email;

  const stored: StoredAuth = {
    token,
    uid,
    email: data.email || email,
    expiresAt: Date.now() + TOKEN_EXPIRY_MS,
    refreshToken: data.refreshToken,
    authMethod: 'email',
  };

  await chrome.storage.local.set({ tp_auth: stored });
}

export async function signInWithGoogle(): Promise<{token: string, uid: string, email: string}> {
  const accessToken = await new Promise<string>((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!token) {
        reject(new Error('No token returned'));
        return;
      }
      resolve(token);
    });
  });

  const res = await fetch('https://api.perfectasin.com/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: accessToken })
  });

  if (!res.ok) {
    await new Promise<void>((resolve) => {
      chrome.identity.removeCachedAuthToken({ token: accessToken }, resolve);
    });
    throw new Error('Backend auth exchange failed');
  }

  const data = await res.json();
  return { token: data.token, uid: data.uid, email: data.email };
}

/** @deprecated — use signInWithGoogle() instead. */
export async function signIn(): Promise<void> {
  await signInWithGoogle();
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

export async function getStoredToken(): Promise<string | null> {
  const stored = await getStoredAuth();
  if (!stored) return null;
  if (Date.now() <= stored.expiresAt) return stored.token;
  return refreshIdToken(stored);
}

/** Return true if a valid, non-expired token exists. */
export async function isAuthenticated(): Promise<boolean> {
  return (await getStoredToken()) !== null;
}

export async function getAuthState(): Promise<{
  authenticated: boolean;
  email: string | null;
  uid: string | null;
}> {
  const stored = await getStoredAuth();
  if (!stored) return { authenticated: false, email: null, uid: null };
  if (Date.now() > stored.expiresAt) {
    const refreshed = await refreshIdToken(stored);
    if (!refreshed) return { authenticated: false, email: null, uid: null };
  }
  return { authenticated: true, email: stored.email, uid: stored.uid };
}

// ─── Internals ────────────────────────────────────────────────────────────────

let refreshInFlight: Promise<string | null> | null = null;

async function refreshIdToken(stored: StoredAuth): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = doRefresh(stored).finally(() => { refreshInFlight = null; });
  return refreshInFlight;
}

async function doRefresh(stored: StoredAuth): Promise<string | null> {
  if (stored.authMethod === 'google') {
    try {
      const accessToken = await new Promise<string>((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: false }, (token) => {
          if (chrome.runtime.lastError || !token) {
            reject(new Error(chrome.runtime.lastError?.message || 'No token'));
            return;
          }
          resolve(token);
        });
      });
      const res = await fetch('https://api.perfectasin.com/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.token) return null;
      const updated: StoredAuth = { ...stored, token: data.token, expiresAt: Date.now() + TOKEN_EXPIRY_MS };
      await chrome.storage.local.set({ tp_auth: updated });
      return data.token;
    } catch {
      return null;
    }
  }

  if (!stored.refreshToken) return null;
  try {
    const res = await fetch(FIREBASE_TOKEN_REFRESH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(stored.refreshToken)}`,
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.id_token) return null;
    const updated: StoredAuth = {
      ...stored,
      token: data.id_token,
      refreshToken: data.refresh_token || stored.refreshToken,
      expiresAt: Date.now() + TOKEN_EXPIRY_MS,
    };
    await chrome.storage.local.set({ tp_auth: updated });
    return data.id_token;
  } catch {
    return null;
  }
}

async function getStoredAuth(): Promise<StoredAuth | null> {
  const result = await chrome.storage.local.get(['tp_auth']);
  return (result.tp_auth as StoredAuth) ?? null;
}
