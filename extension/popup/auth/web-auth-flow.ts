const REDIRECT_BASE = 'https://nnonechpbchjfeiejonjfgikgdajacmj.chromiumapp.org/';
const AUTH_BASE = 'https://perfectasin.com/auth.html';
const TOKEN_EXPIRY_MS = 55 * 60 * 1000; // 55 minutes

interface StoredAuth {
  token: string;
  uid: string;
  email: string;
  expiresAt: number;
}

/** Open sign-in page via launchWebAuthFlow; store returned token/uid/email. */
export async function signIn(): Promise<void> {
  const redirectUrl = await launchAuthFlow(`${AUTH_BASE}?mode=signin`);
  parseAndStore(redirectUrl);
}

/** Open sign-up page via launchWebAuthFlow; store returned token/uid/email. */
export async function signUp(): Promise<void> {
  const redirectUrl = await launchAuthFlow(`${AUTH_BASE}?mode=signup`);
  parseAndStore(redirectUrl);
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

function launchAuthFlow(url: string): Promise<string> {
  const fullUrl = `${url}&redirect_uri=${encodeURIComponent(REDIRECT_BASE)}`;
  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      { url: fullUrl, interactive: true },
      (redirectUrl) => {
        const err = chrome.runtime.lastError;
        if (err || !redirectUrl) {
          reject(new Error(err?.message ?? 'Authentication cancelled'));
          return;
        }
        resolve(redirectUrl);
      },
    );
  });
}

function parseAndStore(redirectUrl: string): void {
  const url = new URL(redirectUrl);
  const error = url.searchParams.get('error');
  if (error) throw new Error(decodeURIComponent(error));

  const token = url.searchParams.get('token');
  const uid = url.searchParams.get('uid');
  const email = url.searchParams.get('email');

  if (!token || !uid || !email) {
    throw new Error('Invalid auth response: missing token, uid, or email');
  }

  const stored: StoredAuth = {
    token,
    uid,
    email: decodeURIComponent(email),
    expiresAt: Date.now() + TOKEN_EXPIRY_MS,
  };

  chrome.storage.local.set({ tp_auth: stored });
}

async function getStoredAuth(): Promise<StoredAuth | null> {
  const result = await chrome.storage.local.get(['tp_auth']);
  return (result.tp_auth as StoredAuth) ?? null;
}
