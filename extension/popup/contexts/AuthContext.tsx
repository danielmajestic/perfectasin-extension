import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { signInWithGoogle, signUp, signOut, signInWithEmail, getStoredToken, getAuthState } from '../auth/web-auth-flow';

interface AuthUser {
  uid: string;
  email: string;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  loading: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signup: () => Promise<void>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Load auth state on mount
  useEffect(() => {
    getAuthState().then((state) => {
      setCurrentUser(
        state.authenticated && state.uid && state.email
          ? { uid: state.uid, email: state.email }
          : null,
      );
      setLoading(false);
    });
  }, []);

  // Sync auth state whenever chrome.storage.local changes (e.g. after sign-in)
  useEffect(() => {
    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if ('tp_auth' in changes) {
        getAuthState().then((state) => {
          setCurrentUser(
            state.authenticated && state.uid && state.email
              ? { uid: state.uid, email: state.email }
              : null,
          );
        });
      }
    };
    chrome.storage.local.onChanged.addListener(listener);
    return () => chrome.storage.local.onChanged.removeListener(listener);
  }, []);

  async function login() {
    const { token, uid, email } = await signInWithGoogle();
    // Clear stale subscription cache so tier is re-fetched from backend
    await chrome.storage.local.remove(['tp_tier', 'tp_status', 'tp_analysesUsed', 'tp_analysisLimit', 'tp_billingCycle', 'tp_currentPeriodEnd']);
    await chrome.storage.local.set({
      tp_auth: { token, uid, email, expiresAt: Date.now() + 55 * 60 * 1000 },
    });
    setCurrentUser({ uid, email });
  }

  async function loginWithEmail(email: string, password: string) {
    // Clear stale subscription cache so tier is re-fetched from backend
    await chrome.storage.local.remove(['tp_tier', 'tp_status', 'tp_analysesUsed', 'tp_analysisLimit', 'tp_billingCycle', 'tp_currentPeriodEnd']);
    await signInWithEmail(email, password);
    const state = await getAuthState();
    if (state.authenticated && state.uid && state.email) {
      setCurrentUser({ uid: state.uid, email: state.email });
    }
  }

  async function signup() {
    await signUp();
    const state = await getAuthState();
    if (state.authenticated && state.uid && state.email) {
      setCurrentUser({ uid: state.uid, email: state.email });
    }
  }

  async function logout() {
    await signOut();
    setCurrentUser(null);
  }

  async function getIdToken(): Promise<string | null> {
    return getStoredToken();
  }

  const value: AuthContextType = {
    currentUser,
    loading,
    login,
    loginWithEmail,
    signup,
    logout,
    getIdToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
