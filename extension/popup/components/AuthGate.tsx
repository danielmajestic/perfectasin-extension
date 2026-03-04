import { useState, type ReactNode, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { resetPassword } from '../auth/web-auth-flow';
import { trackEvent } from '../utils/analytics';

interface AuthGateProps {
  children: ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const { currentUser, loading, login, loginWithEmail } = useAuth();

  // Track 1 — inline email/password form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  // Track 2 — Google sign-in state
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');

  if (loading) {
    return (
      <div className="min-w-[320px] w-full h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (currentUser) {
    return <>{children}</>;
  }

  // ── Track 2: Google sign-in via launchWebAuthFlow (unchanged) ───────────────
  async function handleGoogleSignIn() {
    setGoogleError('');
    setGoogleLoading(true);
    try {
      await login();
      trackEvent('login', { method: 'google_web_auth_flow' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes('cancelled') && !msg.includes('canceled')) {
        setGoogleError(msg || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  // ── Track 1: Inline email/password POST to backend ──────────────────────────
  async function handleEmailSignIn(e: FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!email.trim()) { setFormError('Please enter your email.'); return; }
    if (!password)      { setFormError('Please enter your password.'); return; }

    setEmailLoading(true);
    try {
      await loginWithEmail(email.trim(), password);
      trackEvent('login', { method: 'email_password' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setFormError(msg || 'Sign-in failed. Please try again.');
    } finally {
      setEmailLoading(false);
    }
  }

  return (
    <div className="min-w-[320px] w-full h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">

          {/* Branding */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-gray-800">PerfectASIN™</h1>
            <p className="text-xs text-gray-500 mt-1">AI-Powered Amazon Listing Optimization</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 space-y-4">

            {/* Track 2 — Google sign-in (launchWebAuthFlow, unchanged) */}
            {googleError && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
                {googleError}
              </p>
            )}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || emailLoading}
              className="w-full flex items-center justify-center gap-2.5 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-60 text-gray-700 font-medium py-2.5 rounded-lg shadow-sm transition-colors text-sm"
            >
              {/* Google "G" logo */}
              <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              {googleLoading ? 'Opening Google sign-in...' : 'Sign in with Google'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <div className="flex-1 h-px bg-gray-200" />
              <span>or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Track 1 — Inline email/password form */}
            <form onSubmit={handleEmailSignIn} noValidate className="space-y-3">
              {formError && (
                <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
                  {formError}
                </p>
              )}

              <div>
                <label htmlFor="auth-email" className="block text-xs font-medium text-gray-600 mb-1">
                  Email
                </label>
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={emailLoading || googleLoading}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:opacity-60"
                />
              </div>

              <div>
                <label htmlFor="auth-password" className="block text-xs font-medium text-gray-600 mb-1">
                  Password
                </label>
                <input
                  id="auth-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={emailLoading || googleLoading}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:opacity-60"
                />
              </div>

              <button
                type="submit"
                disabled={emailLoading || googleLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-2.5 rounded-lg shadow-lg shadow-blue-500/30 transition-all duration-200 text-sm"
              >
                {emailLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Footer links */}
            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => resetPassword()}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Forgot password?
              </button>
              <button
                type="button"
                onClick={() => chrome.tabs.create({ url: 'https://perfectasin.com/auth.html?mode=signup' })}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Create account
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
