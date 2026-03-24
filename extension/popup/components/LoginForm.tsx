import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { resetPassword } from '../auth/web-auth-flow';
import { trackEvent } from '../utils/analytics';

interface LoginFormProps {
  onToggleSignup: () => void;
}

export default function LoginForm({ onToggleSignup }: LoginFormProps) {
  const { login, loginWithEmail } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleGoogleSignIn() {
    setError('');
    setLoading(true);
    try {
      await login();
      trackEvent('login', { method: 'web_auth_flow' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('cancelled') || msg.includes('canceled')) {
        // User dismissed — silent
      } else {
        setError(msg || 'Sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }
    setError('');
    setEmailLoading(true);
    try {
      await loginWithEmail(email.trim(), password);
      trackEvent('login', { method: 'email_password' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Sign-in failed. Please try again.');
    } finally {
      setEmailLoading(false);
    }
  }

  const anyLoading = loading || emailLoading;

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={anyLoading}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-2.5 rounded-lg shadow-lg shadow-blue-500/30 transition-all duration-200 text-sm"
      >
        {loading ? 'Opening sign-in...' : 'Sign in with Google'}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Email/Password form */}
      <form onSubmit={handleEmailSignIn} className="space-y-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={anyLoading}
          required
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={anyLoading}
          required
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
        />
        <button
          type="submit"
          disabled={anyLoading}
          className="w-full bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 text-sm"
        >
          {emailLoading ? 'Signing in...' : 'Sign In with Email'}
        </button>
      </form>

      <div className="flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => resetPassword()}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Forgot password?
        </button>
        <button
          type="button"
          onClick={onToggleSignup}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Create account
        </button>
      </div>
    </div>
  );
}
